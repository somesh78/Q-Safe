from io import BytesIO
import logging
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from django.http import HttpResponse, StreamingHttpResponse
from django.contrib.auth.models import User
from django.views.decorators.csrf import csrf_exempt
from django.db.utils import OperationalError

from transfers.serializers import DownloadAuditSerializer
from .models import DownloadAudit, UploadSession, UploadedFile, OnlineEncryptedFile, OfflineJob, UserProfile
from .services.encryption import encrypt_file, decrypt_file, decrypt_stream_chunks, LegacyEncryptedFormatError
from .services.qr_generator import generate_qr, generate_qr_url
from .services.chunking import chunk_bytes
from .services.zipper import create_zip
from .services.storage import get_storage
from .tasks import generate_offline_qr_codes
from .email_utils import generate_verification_token, send_verification_email
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

# File size limits (online limit is configurable via env var)
ONLINE_MAX_FILE_SIZE_MB = config('ONLINE_MAX_FILE_SIZE_MB', default=500, cast=int)
MAX_FILE_SIZE = ONLINE_MAX_FILE_SIZE_MB * 1024 * 1024
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


@api_view(['POST'])
@permission_classes([AllowAny])
@ratelimit(key="ip", rate="5/h", block=True)  # Limit 5 signups per hour per IP
def signup(request):
    raw_email = request.data.get('email', '')
    raw_username = request.data.get('username')
    password = request.data.get('password')

    email = raw_email.strip().lower()

    if not email or not password:
        return Response({'error': 'Email and password are required'}, status=400)

    username = raw_username.strip() if raw_username and raw_username.strip() else email

    # Validate password strength
    password_error = validate_password_strength(password)
    if password_error:
        return Response({"error": password_error}, status=400)

    if User.objects.filter(email=email).exists():
         return Response({'error': 'Email already exists'}, status=400)

    if User.objects.filter(username=username).exists():
        return Response({'error': 'Username already exists'}, status=400)

    # Create user account
    user = User.objects.create_user(username=username, email=email, password=password)
    
    # Send verification email
    try:
        uid, token = generate_verification_token(user)
        send_verification_email(user, uid, token)
        logger.info(f"[SIGNUP] Verification email sent to {email}")
        return Response({
            'message': 'Account created! Please check your email to verify your account before logging in.'
        })
    except Exception as e:
        logger.error(f"[SIGNUP] Failed to send verification email to {email}: {e}")
        # Account still created, just email failed
        return Response({
            'message': 'Account created! However, we could not send the verification email. Please contact support.',
            'warning': 'Email delivery failed'
        })

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
    if max_downloads < 1 or max_downloads > 100:
        return Response({"error": "Max downloads must be between 1 and 100"}, status=400)
    
    if expiry_hours < 1 or expiry_hours > 72:
        return Response({"error": "Expiry hours must be between 1 and 72"}, status=400)
    
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
        if file.size > MAX_FILE_SIZE:
            return Response({
                "error": f"Online mode limited to {ONLINE_MAX_FILE_SIZE_MB}MB.",
                "max_size_mb": ONLINE_MAX_FILE_SIZE_MB
            }, status=413)

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

    # Debug logging
    logger.info(f"[DOWNLOAD] Received request - Token: {signed_token[:20]}...")
    logger.info(f"[DOWNLOAD] Password received: {bool(password)}")
    logger.info(f"[DOWNLOAD] Request data: {request.data}")

    try:
        # Match the expiry time with OnlineEncryptedFile.expires_at (1 hour)
        token = signer.unsign(signed_token, max_age=3600)
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
        # Optimize query - load session data preemptively for audit logging
        encrypted_file = OnlineEncryptedFile.objects.select_related('session').get(token=token)
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
        storage = get_storage()
        logger.info(f"[DOWNLOAD] Opening streamed download from Supabase Storage...")
        stream_ctx = storage.open_download_stream(encrypted_file.file_path)
        upstream = stream_ctx.__enter__()

        try:
            decrypted_chunks = decrypt_stream_chunks(upstream.iter_bytes(chunk_size=65536), password)
            first_chunk = next(decrypted_chunks, b"")
            stream_mode = "v2"
            logger.info("[DOWNLOAD] Using streamed v2 decryption path")
        except LegacyEncryptedFormatError:
            # Backward compatibility for files encrypted with the old format.
            stream_ctx.__exit__(None, None, None)
            stream_ctx = None
            upstream = None

            logger.info("[DOWNLOAD] Legacy encrypted format detected, using compatibility path")
            encrypted_data = storage.download_file(encrypted_file.file_path)
            decrypted = decrypt_file(encrypted_data, password)
            stream_mode = "legacy"
        except Exception:
            if stream_ctx:
                stream_ctx.__exit__(None, None, None)
            raise

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
    if stream_mode == "v2":
        def response_stream():
            try:
                if first_chunk:
                    yield first_chunk
                for chunk in decrypted_chunks:
                    yield chunk
            finally:
                stream_ctx.__exit__(None, None, None)

        response = StreamingHttpResponse(response_stream(), content_type="application/octet-stream")
    else:
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
    # Optimize query with select_related to reduce database hits
    logs = DownloadAudit.objects.filter(
        file__session__user=request.user
    ).select_related(
        'file',
        'file__session', 
        'user'
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

    return Response(result)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def job_status(request, job_id):
    """Get status of an offline QR generation job"""
    try:
        # Optimize with select_related for session data
        job = OfflineJob.objects.select_related('session', 'user').get(
            job_id=job_id, 
            user=request.user
        )
        
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
        # Optimize query - no related data needed for download
        job = OfflineJob.objects.only(
            'job_id', 'user_id', 'status', 'result_file', 
            'original_filename', 'error_message'
        ).get(job_id=job_id, user=request.user)
        
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


@api_view(['GET'])
@permission_classes([AllowAny])
def verify_email(request, uid, token):
    """
    Verify user's email address using the token sent to their email.
    Called when user clicks the verification link.
    """
    from django.contrib.auth.tokens import default_token_generator
    from django.utils.http import urlsafe_base64_decode
    from django.utils.encoding import force_str
    
    try:
        # Decode the user ID
        user_id = force_str(urlsafe_base64_decode(uid))
        user = User.objects.get(pk=user_id)
        
        # Verify the token (automatically checks if expired - 24 hours default)
        if not default_token_generator.check_token(user, token):
            logger.warning(f"[VERIFY] Invalid or expired token for user {user.username}")
            return Response({
                'error': 'Invalid or expired verification link. Please request a new one.'
            }, status=400)
        
        # Mark user as verified
        profile, _ = UserProfile.objects.get_or_create(user=user)
        if profile.is_verified:
            logger.info(f"[VERIFY] User {user.username} already verified")
            return Response({
                'message': 'Your email is already verified! You can log in now.'
            })
        
        profile.is_verified = True
        profile.save()
        
        logger.info(f"[VERIFY] Successfully verified email for user {user.username}")
        return Response({
            'message': 'Email verified successfully! You can now log in.',
            'verified': True
        })
        
    except (TypeError, ValueError, OverflowError, User.DoesNotExist) as e:
        logger.error(f"[VERIFY] Verification failed: {e}")
        return Response({
            'error': 'Invalid verification link.'
        }, status=400)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
@ratelimit(key="user", rate="3/h", block=True)
def resend_verification_email(request):
    """
    Resend verification email to the authenticated user.
    Rate limited to prevent abuse.
    """
    user = request.user
    profile, _ = UserProfile.objects.get_or_create(user=user)
    
    if profile.is_verified:
        return Response({
            'message': 'Your email is already verified!'
        })
    
    try:
        uid, token = generate_verification_token(user)
        send_verification_email(user, uid, token)
        logger.info(f"[RESEND] Verification email resent to {user.email}")
        return Response({
            'message': 'Verification email sent! Please check your inbox.'
        })
    except Exception as e:
        logger.error(f"[RESEND] Failed to send verification email: {e}")
        return Response({
            'error': 'Failed to send verification email. Please try again later.'
        }, status=500)

