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
from .models import DownloadAudit, UploadSession, UploadedFile, OnlineEncryptedFile, OfflineJob
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
def signup(request):
    username = request.data.get('username')
    password = request.data.get('password')

    if not username or not password:
        return Response({'error': 'Username and password are required'}, status=400)

    if len(password) < 8:
        return Response({"error": "Weak password"}, status=400)

    if User.objects.filter(username=username).exists():
        return Response({'error': 'Username already exists'}, status=400)

    user = User.objects.create_user(username=username, password=password)
    return Response({'message': 'Account created successfully'})

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
    return Response({
        'session_id': str(session.session_id),
        'mode': session.mode, 
        'created_at': session.created_at
        })

@csrf_exempt
@api_view(['POST'])
@permission_classes([IsAuthenticated])
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

@csrf_exempt
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

    encrypted_file.download_count += 1

    # Log audit BEFORE potentially deleting the file
    log_audit(encrypted_file, ip, request, "SUCCESS", None)

    if encrypted_file.download_count >= encrypted_file.max_downloads:
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

    response = HttpResponse(decrypted, content_type="application/octet-stream")
    response["Content-Disposition"] = f'attachment; filename="{encrypted_file.original_filename}"'
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

    return Response(result)


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

