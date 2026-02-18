from io import BytesIO
import logging
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from django.http import HttpResponse
from django.contrib.auth.models import User
from django.views.decorators.csrf import csrf_exempt
from django.db.utils import OperationalError

from transfers.serializers import DownloadAuditSerializer
from .models import DownloadAudit, UploadSession, UploadedFile, OnlineEncryptedFile, OfflineJob, ContactMessage, UserProfile
from .email_utils import generate_verification_token, send_verification_email
from .services.encryption import encrypt_file, decrypt_file
from .services.qr_generator import generate_qr, generate_qr_url
from .services.chunking import chunk_bytes
from .services.zipper import create_zip
from .services.storage import get_storage
from .tasks import generate_offline_qr_codes
import base64, uuid,zipfile, json, base64, hashlib
from pyzbar.pyzbar import decode as qr_decode, ZBarSymbol
from PIL import Image as PILImage
from decouple import config
from django.utils import timezone
from django.utils.timezone import now, timedelta
from rest_framework.permissions import IsAuthenticated
from django.core.signing import TimestampSigner, BadSignature, SignatureExpired
from django_ratelimit.decorators import ratelimit
from rest_framework_simplejwt.tokens import RefreshToken

logger = logging.getLogger(__name__)

# File size limits optimized for low-traffic deployment on ~1GB RAM EC2
# With few concurrent users, we can be more aggressive
MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB for online mode (streaming to disk + Supabase storage)
MAX_OFFLINE_FILE_SIZE = 20 * 1024 * 1024  # 20MB for offline mode (~11,000 QR codes)

signer = TimestampSigner()

def validate_password_strength(password):
    """
    Validate password meets security requirements:
    - At least 8 characters
    - Contains uppercase letter
    - Contains number
    - Contains special character
    """
    if len(password) < 8:
        return "Password must be at least 8 characters"
    if not any(c.isupper() for c in password):
        return "Password must contain at least one uppercase letter"
    if not any(c.isdigit() for c in password):
        return "Password must contain at least one number"
    if not any(c in '!@#$%^&*()_+-=[]{}|;:,.<>?/' for c in password):
        return "Password must contain at least one special character"
    return None

def log_audit(file, ip, request, status, reason=None):
    DownloadAudit.objects.create(
        file=file,
        user=request.user if request.user.is_authenticated else None,
        ip_address=ip,
        status=status,
        reason=reason
    )


@api_view(['GET'])
@permission_classes([AllowAny])
def blog_posts(request):
    """Public marketing blog feed for the frontend."""
    posts = [
        {
            "slug": "end-to-end-encryption-explained",
            "title": "Understanding End-to-End Encryption",
            "excerpt": "How E2EE protects files from device to recipient and what to watch for when evaluating vendors.",
            "content": "End-to-end encryption keeps data encrypted from the moment it leaves your device until it is decrypted by the intended recipient. In this guide we cover key exchange, forward secrecy, and why QR-based offline exchange matters for zero-trust file sharing.",
            "date": "February 10, 2026",
            "category": "Security",
            "read_time": "5 min read",
            "tags": ["E2EE", "Zero Trust", "Key Management"],
            "image": "🔒"
        },
        {
            "slug": "secure-file-sharing-checklist",
            "title": "Best Practices for Secure File Sharing",
            "excerpt": "A step-by-step checklist for teams sharing sensitive files internally or with vendors.",
            "content": "From access scoping and password policies to IP allowlists and download caps, this checklist shows how to ship files safely without slowing collaboration. Includes a ready-to-use runbook for incident response.",
            "date": "February 5, 2026",
            "category": "Guides",
            "read_time": "7 min read",
            "tags": ["Runbook", "Governance", "IP Lock"],
            "image": "📁"
        },
        {
            "slug": "offline-qr-mode",
            "title": "Introducing Offline QR Mode",
            "excerpt": "Exchange files in air-gapped environments using rotating QR frames—no internet required.",
            "content": "Offline QR mode slices your payload into encrypted frames, rotates QR codes, and reconstructs the file on the receiving device. Ideal for classified networks and lab environments. We cover performance limits, retry logic, and checksum validation.",
            "date": "January 28, 2026",
            "category": "Features",
            "read_time": "4 min read",
            "tags": ["Air-gapped", "QR", "Offline"],
            "image": "📱"
        },
        {
            "slug": "gdpr-compliance-data-protection",
            "title": "GDPR Compliance and Data Protection",
            "excerpt": "How Q-Safe aligns with GDPR requirements for data minimization, access controls, and auditability.",
            "content": "We detail our data retention defaults, encryption controls, subprocessor posture, and how customers can fulfill data subject requests using audit exports. Mapped to Articles 5, 25, and 32 with practical guidance.",
            "date": "January 20, 2026",
            "category": "Compliance",
            "read_time": "6 min read",
            "tags": ["GDPR", "Audit", "Retention"],
            "image": "⚖️"
        },
        {
            "slug": "aes-256-encryption",
            "title": "AES-256 Encryption Explained",
            "excerpt": "A concise primer on AES-256, modes of operation, and why we pair it with strong key derivation.",
            "content": "AES-256 provides confidentiality when paired with secure key handling. We discuss GCM vs CBC, IV reuse pitfalls, and why we enforce PBKDF2+HMAC with high iteration counts for user-supplied passwords.",
            "date": "January 12, 2026",
            "category": "Technology",
            "read_time": "8 min read",
            "tags": ["AES-256", "KDF", "Crypto"],
            "image": "🛡️"
        },
        {
            "slug": "remote-work-file-transfers",
            "title": "Securing Remote Work File Transfers",
            "excerpt": "Patterns for distributed teams to ship sensitive files without VPN bottlenecks.",
            "content": "Covers device posture checks, short-lived download links, IP locking per session, and automated expiry. Includes a template for vendor onboarding and offboarding.",
            "date": "January 3, 2026",
            "category": "Enterprise",
            "read_time": "5 min read",
            "tags": ["Remote Work", "Zero Trust", "Policy"],
            "image": "💼"
        },
    ]
    return Response(posts)


@api_view(['POST'])
@permission_classes([AllowAny])
@ratelimit(key="ip", rate="10/h", block=True)
def contact_form(request):
    """Accept contact form submissions and store in database."""
    name = request.data.get('name', '').strip()
    email = request.data.get('email', '').strip()
    subject = request.data.get('subject', '').strip()
    message = request.data.get('message', '').strip()
    msg_type = request.data.get('type', 'general').strip()

    # Validate required fields
    if not name or not email or not subject or not message:
        return Response({'error': 'All fields are required'}, status=400)

    if len(message) < 10:
        return Response({'error': 'Message must be at least 10 characters'}, status=400)

    if msg_type not in dict(ContactMessage.TYPE_CHOICES):
        msg_type = 'general'

    ContactMessage.objects.create(
        name=name,
        email=email,
        subject=subject,
        message=message,
        type=msg_type,
    )

    logger.info(f"[CONTACT] New message from {name} ({email}): {subject}")
    return Response({'message': 'Your message has been received. We will get back to you soon.'}, status=201)


@api_view(['POST'])
@permission_classes([AllowAny])
@ratelimit(key="ip", rate="5/h", block=True)  # Limit 5 signups per hour per IP
def signup(request):
    email = request.data.get('email', '').strip().lower()
    password = request.data.get('password')
    username = request.data.get('username', '').strip()

    if not email or not password:
        return Response({'error': 'Email and password are required'}, status=400)

    # Use email as username if username not provided
    if not username:
        username = email

    # Validate password strength
    password_error = validate_password_strength(password)
    if password_error:
        return Response({"error": password_error}, status=400)

    # Check email uniqueness (primary identifier)
    if User.objects.filter(email=email).exists():
        return Response({'error': 'An account with this email already exists'}, status=400)

    if User.objects.filter(username=username).exists():
        return Response({'error': 'This username is already taken'}, status=400)

    user = User.objects.create_user(username=username, password=password, email=email)

    # Send verification email
    try:
        uid, token = generate_verification_token(user)
        send_verification_email(user, uid, token)
        return Response({'message': 'Account created! Please check your email to verify your account.'})
    except Exception as e:
        logger.error(f"[SIGNUP] Failed to send verification email: {e}")
        return Response({'message': 'Account created. Email verification could not be sent — try resending from your dashboard.'})

@csrf_exempt
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout(request):
    try:
        refresh_token = request.data.get('refresh')
        token = RefreshToken(refresh_token)
        token.blacklist()
        return Response({"message": "Logged out successfully"})
    except Exception as e:
        return Response({"error": str(e)}, status=400)


@api_view(['GET'])
@permission_classes([AllowAny])
def verify_email(request, uid, token):
    """Verify a user's email address using the token from the verification email."""
    from django.utils.http import urlsafe_base64_decode
    from django.contrib.auth.tokens import default_token_generator

    try:
        user_id = urlsafe_base64_decode(uid).decode()
        user = User.objects.get(pk=user_id)
    except (TypeError, ValueError, OverflowError, User.DoesNotExist):
        return Response({'error': 'Invalid verification link'}, status=400)

    if not default_token_generator.check_token(user, token):
        return Response({'error': 'Verification link has expired or is invalid'}, status=400)

    # Mark user as verified
    profile, _ = UserProfile.objects.get_or_create(user=user)
    profile.is_verified = True
    profile.save()

    logger.info(f"[VERIFY] User {user.username} email verified successfully")
    return Response({'message': 'Email verified successfully! You can now log in.'})


@api_view(['POST'])
@permission_classes([AllowAny])
@ratelimit(key="ip", rate="5/h", block=True)
def resend_verification(request):
    """Resend verification email for users who haven't verified yet."""
    email = request.data.get('email', '').strip()

    if not email:
        return Response({'error': 'Email is required'}, status=400)

    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        # Don't reveal if email exists
        return Response({'message': 'If an account with that email exists, a verification email has been sent.'})

    profile, _ = UserProfile.objects.get_or_create(user=user)
    if profile.is_verified:
        return Response({'message': 'This email is already verified.'})

    uid, token = generate_verification_token(user)
    send_verification_email(user, uid, token)

    return Response({'message': 'If an account with that email exists, a verification email has been sent.'})

@csrf_exempt
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_session(request):
    mode = request.data.get('mode')
    if mode not in ['ONLINE', 'OFFLINE']:
        return Response({'error': 'Mode must be Online or Offline'}, status=400)
    session = UploadSession.objects.create(
        mode=mode,
        user=request.user
        )
    
    # Log session creation
    ip = request.META.get('REMOTE_ADDR', 'unknown')
    logger.info(f"[SESSION] User {request.user.username} created {mode} session {session.session_id} from {ip}")
    
    return Response({
        'session_id': str(session.session_id),
        'mode': session.mode, 
        'created_at': session.created_at
        })

@csrf_exempt  # Safe: JWT auth in Authorization header, not cookies. Multipart form-data with DRF.
@api_view(['POST'])
@permission_classes([IsAuthenticated])
@ratelimit(key="user", rate="20/h", block=True)  # Limit 20 uploads per hour per user
def upload_file(request):
    session_id = request.data.get("session_id")
    password = request.data.get("password")
    file = request.FILES.get("file")
    enable_ip_lock = request.data.get("enable_ip_lock") == "true"
    
    # Get configurable options with defaults
    max_downloads = int(request.data.get("max_downloads", 3))  # Default: 3 downloads
    expiry_hours = int(request.data.get("expiry_hours", 1))    # Default: 1 hour

    if not session_id or not file or not password:
        return Response({"error": "Session ID, file, and password are required"}, status=400)
    
    # Validate options
    if max_downloads < 1 or max_downloads > 10:
        return Response({"error": "Max downloads must be between 1 and 10"}, status=400)
    
    if expiry_hours < 1 or expiry_hours > 24:
        return Response({"error": "Expiry hours must be between 1 and 24"}, status=400)
    
    if file.size > MAX_FILE_SIZE:
        return Response(
            {"error": "File too large"},
            status=413
    )

    try:
        session = UploadSession.objects.get(session_id=session_id, is_active=True, user=request.user)
    except UploadSession.DoesNotExist:
        return Response({"error": "Invalid or inactive session ID"}, status=404)
    
    # Check file size limits based on mode
    if session.mode == "OFFLINE":
        if file.size > MAX_OFFLINE_FILE_SIZE:
            return Response({
                "error": f"Offline mode limited to {MAX_OFFLINE_FILE_SIZE // (1024*1024)}MB due to QR generation constraints. Use Online mode for larger files.",
                "max_size_mb": MAX_OFFLINE_FILE_SIZE // (1024*1024)
            }, status=413)
    
    if session.mode == "ONLINE":
        password = request.data.get("password")

        if not password:
            return Response({"error": "Password is required for online mode"}, status=400)
        
        # Encrypt file
        file_data = file.read()
        encrypted_data = encrypt_file(file_data, password)
        del file_data
        
        # Generate token first
        file_token = uuid.uuid4()
        file_path = f"{file_token}.enc"
        
        try:
            # Upload to Supabase Storage
            storage = get_storage()
            storage.upload_file(file_path, encrypted_data)
            
            # Clear encrypted data from memory
            del encrypted_data
            
            # Save metadata to database (no encrypted_data field)
            encrypted_file = OnlineEncryptedFile.objects.create(
                session=session,
                file_path=file_path,  # Store Supabase path
                token=file_token,
                original_filename=file.name,
                enable_ip_lock=enable_ip_lock,
                expires_at=now() + timedelta(hours=expiry_hours),
                max_downloads=max_downloads
            )
            
            # Log successful upload
            ip = request.META.get('REMOTE_ADDR', 'unknown')
            logger.info(f"[UPLOAD] User {request.user.username} uploaded {file.name} ({file.size} bytes) from {ip}")
            
        except Exception as e:
            logger.error(f"Failed to upload file: {e}")
            return Response({"error": "Failed to upload file"}, status=500)


        session.is_active = False
        session.save()

        BASE_URL = config('FRONTEND_URL', default='https://q-safe-frontend.onrender.com')
        signed_token = signer.sign(str(encrypted_file.token))
        download_url = f"{BASE_URL}/download/{signed_token}/"
        qr_bytes = generate_qr_url(download_url)
        qr_base64 = base64.b64encode(qr_bytes).decode()

        return Response({
            "message": "File uploaded and encrypted successfully",
            "filename": encrypted_file.original_filename,
            "mode": session.mode,
            "download_url": download_url,
            "qr_code": qr_base64,
            "settings": {
                "max_downloads": max_downloads,
                "expiry_hours": expiry_hours,
                "ip_lock_enabled": enable_ip_lock
            }
        })
    
    if session.mode == "OFFLINE":
        logger.info("[OFFLINE MODE] Starting async job...")
        password = request.data.get("password")
        logger.info(f"[OFFLINE MODE] File size: {file.size} bytes")
        
        if not password:
            return Response({"error": "Password is required for offline mode"}, status=400)
        
        # Read and encrypt file data
        file_data = file.read()
        encrypted_data = encrypt_file(file_data, password)
        logger.info(f"[OFFLINE MODE] Encrypted data size: {len(encrypted_data)} bytes")
        
        # Store encrypted chunks in UploadedFile for the task to process
        # Store the file data temporarily in UploadedFile chunks
        CHUNK_SIZE = 1 * 1024 * 1024  # 1MB chunks for storage
        total_chunks = (len(encrypted_data) + CHUNK_SIZE - 1) // CHUNK_SIZE
        
        for i in range(total_chunks):
            start = i * CHUNK_SIZE
            end = min(start + CHUNK_SIZE, len(encrypted_data))
            chunk_data = encrypted_data[start:end]
            
            UploadedFile.objects.create(
                session=session,
                original_filename=file.name,
                chunk_index=i,
                chunk_data=chunk_data,
                total_chunks=total_chunks
            )
        
        # Store password in session for task access
        session.password = password
        session.original_filename = file.name
        session.is_active = False
        session.save()
        
        logger.info(f"[OFFLINE MODE] Stored {total_chunks} chunks in database")
        
        # Queue async task
        task = generate_offline_qr_codes.delay(str(session.session_id), request.user.id)
        logger.info(f"[OFFLINE MODE] Queued task {task.id}")
        
        # Create job record
        job = OfflineJob.objects.create(
            session=session,
            user=request.user,
            original_filename=file.name,
            status='PENDING'
        )
        
        # Log successful offline upload
        ip = request.META.get('REMOTE_ADDR', 'unknown')
        logger.info(f"[UPLOAD] User {request.user.username} uploaded {file.name} ({file.size} bytes) for offline QR generation from {ip}")
        
        return Response({
            "message": "QR code generation started",
            "job_id": str(job.job_id),
            "task_id": task.id,
            "filename": file.name,
            "mode": "OFFLINE"
        })

@csrf_exempt
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def reconstruct_from_zip(request):
    zip_file = request.FILES.get("zip")
    password = request.data.get("password")
    if not password:
        return Response({"error": "Password is required for decryption"}, status=400)
    if not zip_file:
        return Response({"error": "ZIP file is required"}, status=400)

    chunks = {}
    original_filename = "reconstructed_file.bin"
    content_type = "application/octet-stream"
    metadata = None

    try:
        with zipfile.ZipFile(zip_file) as z:
            # First pass: read metadata
            if "metadata.json" in z.namelist():
                metadata = json.loads(z.read("metadata.json").decode())
                original_filename = metadata.get("original_filename", original_filename)
                content_type = metadata.get("content_type", content_type)
                logger.info(f"[RECONSTRUCT] Metadata found: {original_filename}, {metadata.get('total_chunks')} chunks expected")
            
            # Second pass: process QR images (memory-efficient batch processing)
            png_files = [name for name in z.namelist() if name.lower().endswith(".png")]
            logger.info(f"[RECONSTRUCT] Found {len(png_files)} PNG files to process")
            
            processed_count = 0
            for name in png_files:
                try:
                    image_bytes = z.read(name)
                    image = PILImage.open(BytesIO(image_bytes)).convert("RGB")
                    
                    # Only scan for QR codes to avoid DataBar errors
                    decoded_objects = qr_decode(image, symbols=[ZBarSymbol.QRCODE])
                    
                    # Close image to free memory
                    image.close()
                    
                    if not decoded_objects:
                        logger.warning(f"[RECONSTRUCT] No QR code found in {name}")
                        continue

                    payload = json.loads(decoded_objects[0].data.decode())
                    index = payload.get("index")
                    data = payload.get("data")

                    if index is None or data is None:
                        logger.warning(f"[RECONSTRUCT] Invalid payload in {name}")
                        continue

                    chunks[index] = data
                    processed_count += 1
                    
                    # Log progress every 100 chunks
                    if processed_count % 100 == 0:
                        logger.info(f"[RECONSTRUCT] Processed {processed_count}/{len(png_files)} images")
                        
                except Exception as e:
                    logger.error(f"[RECONSTRUCT] Error processing {name}: {e}")
                    continue
            
            logger.info(f"[RECONSTRUCT] Successfully decoded {len(chunks)} QR codes")

        # 🔑 3. VALIDATE CHUNKS
        if not chunks:
            return Response(
                {"error": "No readable QR codes found in ZIP"},
                status=400
            )
        
        expected_total = metadata.get("total_chunks")

        if expected_total and len(chunks) != expected_total:
            return Response(
                {
                    "error": "Missing QR chunks",
                    "expected": expected_total,
                    "found": len(chunks)
                },
                status=400
            )
        
        # Validate chunk indices are sequential (0, 1, 2, ..., n-1)
        chunk_indices = sorted(chunks.keys())
        expected_indices = list(range(len(chunks)))
        if chunk_indices != expected_indices:
            logger.error(f"[RECONSTRUCT] Non-sequential chunk indices: {chunk_indices}")
            return Response(
                {
                    "error": "Invalid chunk sequence",
                    "details": "Chunks must be sequential starting from 0"
                },
                status=400
            )

        # 🔑 4. REASSEMBLE ENCRYPTED BYTES
        encrypted_bytes = b"".join(
            base64.b64decode(chunks[i])
            for i in sorted(chunks.keys())
        )

        # 🔑 4.5. VERIFY FILE INTEGRITY
        expected_checksum = metadata.get("checksum")
        if expected_checksum:
            calculated_checksum = hashlib.sha256(encrypted_bytes).hexdigest()
            if calculated_checksum != expected_checksum:
                logger.error(f"[RECONSTRUCT] Checksum mismatch! Expected: {expected_checksum}, Got: {calculated_checksum}")
                return Response(
                    {"error": "File corrupted - checksum mismatch"},
                    status=400
                )
            logger.info(f"[RECONSTRUCT] Checksum verified: {calculated_checksum}")
        else:
            logger.warning("[RECONSTRUCT] Warning: No checksum in metadata (old format)")

        logger.info(f"[RECONSTRUCT] Attempting decryption of {len(encrypted_bytes)} bytes")
        logger.info(f"[RECONSTRUCT] First 50 bytes (hex): {encrypted_bytes[:50].hex()}")
        
        reconstructed_data = decrypt_file(encrypted_bytes, password)

        # 🔑 5. RETURN FILE WITH ORIGINAL METADATA
        response = HttpResponse(
            reconstructed_data,
            content_type=content_type
        )
        response["Content-Disposition"] = (
            f'attachment; filename="{original_filename}"'
        )
        return response

    except Exception as e:
        logger.error("Reconstruction failed", exc_info=True)
        return Response(
            {"error": f"Reconstruction failed: {str(e)}"},
            status=500
        )

MAX_ATTEMPTS = 5
LOCK_DURATION = 10

@csrf_exempt  # Safe: Public endpoint with signed token + password auth, not session cookies.
@ratelimit(key="ip", rate="10/m", block=True)
@api_view(["POST"])
@authentication_classes([])
@permission_classes([AllowAny])
def download_online_file(request, signed_token):
    password = request.data.get("password")
    ip = request.META.get("REMOTE_ADDR")

    # Debug logging (never log passwords or full request data)
    logger.info(f"[DOWNLOAD] Received request - Token: {signed_token[:20]}...")
    logger.info(f"[DOWNLOAD] Password received: {bool(password)}")

    try:
        # Allow tokens up to 24 hours (matches the maximum user-configurable expiry)
        token = signer.unsign(signed_token, max_age=86400)
        logger.info(f"[DOWNLOAD] Token unsigned successfully: {token}")
    except SignatureExpired:
        logger.warning(f"[DOWNLOAD] Token expired: {signed_token}")
        return Response({"error": "Link has expired"}, status=410)
    except BadSignature:
        logger.warning(f"[DOWNLOAD] Invalid token signature: {signed_token}")
        return Response({"error": "Invalid link"}, status=404)
    
    if not password:
        logger.warning(f"[DOWNLOAD] No password provided")
        return Response({"error": "Password required"}, status=400)

    try:
        encrypted_file = OnlineEncryptedFile.objects.get(token=token)
        logger.info(f"[DOWNLOAD] Found encrypted file: {encrypted_file.original_filename}")
        logger.info(f"[DOWNLOAD] File path: {encrypted_file.file_path}")
        logger.info(f"[DOWNLOAD] Download count: {encrypted_file.download_count}")
        logger.info(f"[DOWNLOAD] Expires at: {encrypted_file.expires_at}")
    except OnlineEncryptedFile.DoesNotExist:
        logger.warning(f"[DOWNLOAD] File not found for token: {token}")
        return Response({"error": "Invalid link"}, status=404)

    if encrypted_file.enable_ip_lock:
        if not encrypted_file.allowed_ip:
            encrypted_file.allowed_ip = ip
            encrypted_file.save()
        elif encrypted_file.allowed_ip != ip and encrypted_file.download_count > 0:
            log_audit(encrypted_file, ip, request, "FAILED", "IP locked")
            return Response({"error": "This file is locked to a different IP address"}, status=403)

    if encrypted_file.locked_until and encrypted_file.locked_until > timezone.now():
        log_audit(encrypted_file, ip, request, "FAILED", "Temporarily locked")
        return Response({"error": "Too many failed attempts. Please try again later"}, status=403)
    
    if encrypted_file.locked_until and encrypted_file.locked_until < timezone.now():
        encrypted_file.failed_attempts = 0
        encrypted_file.locked_until = None
        encrypted_file.save()
    
    if encrypted_file.expires_at < timezone.now():
        log_audit(encrypted_file, ip, request, "FAILED", "Expired")
        return Response({"error": "Link has expired"}, status=410)

    if encrypted_file.download_count >= encrypted_file.max_downloads:
        log_audit(encrypted_file, ip, request, "FAILED", "Download limit reached")
        return Response({"error": "Download limit reached"}, status=429)

    try:
        logger.info(f"[DOWNLOAD] Downloading from Supabase Storage...")
        storage = get_storage()
        encrypted_data = storage.download_file(encrypted_file.file_path)
        
        logger.info(f"[DOWNLOAD] Starting decryption...")
        decrypted = decrypt_file(encrypted_data, password)
        logger.info(f"[DOWNLOAD] Decryption successful! Decrypted size: {len(decrypted)} bytes")

        encrypted_file.failed_attempts = 0
        encrypted_file.locked_until = None
    except Exception as e:
        logger.error(f"[DOWNLOAD] Download or decryption failed: {type(e).__name__}: {str(e)}")
        encrypted_file.failed_attempts += 1
        if encrypted_file.failed_attempts >= MAX_ATTEMPTS:
            encrypted_file.locked_until = timezone.now() + timedelta(minutes=LOCK_DURATION)

        encrypted_file.save()
        log_audit(encrypted_file, ip, request, "FAILED", "Wrong password or file error")
        return Response({"error": "Wrong password or file not found"}, status=400)

    # Increment download count (but don't save yet)
    encrypted_file.download_count += 1

    # Check if this will be the last download
    will_delete = encrypted_file.download_count >= encrypted_file.max_downloads
    
    # Create response before committing changes
    response = HttpResponse(decrypted, content_type="application/octet-stream")
    response["Content-Disposition"] = f'attachment; filename="{encrypted_file.original_filename}"'

    # Log audit BEFORE potentially deleting the file
    log_audit(encrypted_file, ip, request, "SUCCESS", None)

    # Now commit the changes as late as possible
    if will_delete:
        # Delete from Supabase Storage
        try:
            storage = get_storage()
            storage.delete_file(encrypted_file.file_path)
        except Exception as e:
            logger.error(f"Failed to delete file from Supabase: {e}")
        
        # Delete from database
        encrypted_file.delete()
    else:
        encrypted_file.save()

    return response

@csrf_exempt
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def audit_logs(request):
    logs = DownloadAudit.objects.filter(
        file__session__user=request.user
    ).order_by('-timestamp')[:100]

    serializer = DownloadAuditSerializer(logs, many=True)
    return Response(serializer.data)


@csrf_exempt
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def user_files(request):
    files = OnlineEncryptedFile.objects.filter(
        session__user=request.user
    ).select_related("session").order_by("-uploaded_at")

    result = []

    for f in files:
        result.append({
            "id": f.id,
            "session_id": str(f.session.session_id),
            "filename": f.original_filename,
            "downloads": f.download_count,
            "expires_at": f.expires_at,
            "ip_lock": f.enable_ip_lock,
            "created_at": f.uploaded_at,
        })

    # Include user info
    profile, _ = UserProfile.objects.get_or_create(user=request.user)
    user_info = {
        "username": request.user.username,
        "email": request.user.email or '',
        "is_verified": profile.is_verified,
    }

    return Response({"files": result, "user": user_info})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def job_status(request, job_id):
    """Get status of an offline QR generation job"""
    try:
        job = OfflineJob.objects.get(job_id=job_id, user=request.user)
        
        return Response({
            "job_id": str(job.job_id),
            "status": job.status,
            "progress": {
                "total_chunks": job.total_chunks,
                "processed_chunks": job.processed_chunks,
                "percent": job.progress_percent
            },
            "original_filename": job.original_filename,
            "created_at": job.created_at,
            "completed_at": job.completed_at,
            "error_message": job.error_message
        })
    except OfflineJob.DoesNotExist:
        return Response({"error": "Job not found"}, status=404)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def job_download(request, job_id):
    """Download completed QR code ZIP file"""
    try:
        job = OfflineJob.objects.get(job_id=job_id, user=request.user)
        
        if job.status != 'COMPLETED':
            return Response({
                "error": "Job not completed",
                "status": job.status,
                "progress": job.progress_percent
            }, status=400)
        
        if not job.result_file:
            return Response({"error": "Result file not available"}, status=404)
        
        # Return ZIP file
        response = HttpResponse(bytes(job.result_file), content_type='application/zip')
        response['Content-Disposition'] = f'attachment; filename="offline_qr_{job.original_filename}.zip"'
        
        # Optional: Delete job after download to save space
        # job.delete()
        
        return response
        
    except OfflineJob.DoesNotExist:
        return Response({"error": "Job not found"}, status=404)

