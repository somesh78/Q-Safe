from io import BytesIO
import logging
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from django.http import HttpResponse
from django.contrib.auth.models import User
from django.views.decorators.csrf import csrf_exempt

from transfers.serializers import DownloadAuditSerializer
from .models import DownloadAudit, UploadSession, UploadedFile, OnlineEncryptedFile
from .services.encryption import encrypt_file, decrypt_file
from .services.qr_generator import generate_qr, generate_qr_url
from .services.chunking import chunk_bytes
from .services.zipper import create_zip
import base64, uuid,zipfile, json, base64, hashlib
from pyzbar.pyzbar import decode as qr_decode
from PIL import Image as PILImage
from decouple import config
from django.utils import timezone
from django.utils.timezone import now, timedelta
from rest_framework.permissions import IsAuthenticated
from django.core.signing import TimestampSigner, BadSignature, SignatureExpired
from django_ratelimit.decorators import ratelimit
from rest_framework_simplejwt.tokens import RefreshToken

logger = logging.getLogger(__name__)

MAX_FILE_SIZE = 20 * 1024 * 1024  # 20MB

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

    if not session_id or not file or not password:
        return Response({"error": "Session ID, file, and password are required"}, status=400)
    
    if file.size > MAX_FILE_SIZE:
        return Response(
            {"error": "File too large"},
            status=413
    )

    try:
        session = UploadSession.objects.get(session_id=session_id, is_active=True, user=request.user)
    except UploadSession.DoesNotExist:
        return Response({"error": "Invalid or inactive session ID"}, status=404)
    
    if session.mode == "ONLINE":
        password = request.data.get("password")

        if not password:
            return Response({"error": "Password is required for online mode"}, status=400)
        
        encrypted_data = encrypt_file(file.read(), password)
        encrypted_file = OnlineEncryptedFile.objects.create(
            session=session,
            encrypted_data=encrypted_data,
            token=uuid.uuid4(),
            original_filename=file.name,
            enable_ip_lock=enable_ip_lock,
            expires_at=now() + timedelta(hours=1)
        )

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
            "qr_code": qr_base64
        })
    
    if session.mode == "OFFLINE":
        logger.info("[OFFLINE MODE] Starting...")
        password = request.data.get("password")
        logger.info(f"[OFFLINE MODE] File size: {file.size} bytes")
        encrypted_data = encrypt_file(file.read(), password )
        logger.info(f"[OFFLINE MODE] Encrypted data size: {len(encrypted_data)} bytes")

        session.is_active = False
        session.save()

        chunks = chunk_bytes(encrypted_data)
        logger.info(f"[OFFLINE MODE] Created {len(chunks)} chunks")

        # Calculate checksum for integrity verification
        checksum = hashlib.sha256(encrypted_data).hexdigest()
        logger.info(f"[OFFLINE MODE] Checksum: {checksum}")

        file_id = str(uuid.uuid4())
        qr_images = []
        metadata = {
            "original_filename": file.name,
            "content_type": file.content_type,
            "file_id": file_id,
            "total_chunks": len(chunks),
            "checksum": checksum
        }
        qr_images.append(("metadata.json", json.dumps(metadata).encode("utf-8")))
        logger.info(f"[OFFLINE MODE] Generating {len(chunks)} QR codes...")
        for idx, chunk in enumerate(chunks):
            payload = {
                "file_id": file_id,
                "index": chunk["index"],
                "total": chunk["total"],
                "data": chunk["data"]
            }
            qr_png = generate_qr(payload)
            filename = f"qr_{chunk['index']:03}.png"
            qr_images.append((filename, qr_png))
            if (idx + 1) % 5 == 0:
                logger.debug(f"[OFFLINE MODE] Generated {idx + 1}/{len(chunks)} QR codes")
        
        logger.info(f"[OFFLINE MODE] Creating ZIP with {len(qr_images)} files...")
        zip_bytes = create_zip(qr_images)
        logger.info(f"[OFFLINE MODE] ZIP created: {len(zip_bytes)} bytes")

        response = HttpResponse(zip_bytes, content_type='application/zip')
        response['Content-Disposition'] = f'attachment; filename="offline_qr_{file.name}.zip"'
        logger.info("[OFFLINE MODE] Returning response")
        return response

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

    try:
        with zipfile.ZipFile(zip_file) as z:
            for name in z.namelist():

                # 🔑 1. READ METADATA
                if name == "metadata.json":
                    metadata = json.loads(z.read(name).decode())
                    original_filename = metadata.get(
                        "original_filename", original_filename
                    )
                    content_type = metadata.get(
                        "content_type", content_type
                    )
                    continue

                # 🔑 2. PROCESS QR IMAGES
                if not name.lower().endswith(".png"):
                    continue

                image_bytes = z.read(name)

                image = PILImage.open(
                    BytesIO(image_bytes)
                ).convert("RGB")

                decoded_objects = qr_decode(image)
                if not decoded_objects:
                    continue

                payload = json.loads(decoded_objects[0].data.decode())

                index = payload.get("index")
                data = payload.get("data")

                if index is None or data is None:
                    continue

                chunks[index] = data

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
                return Response(
                    {"error": "File corrupted - checksum mismatch"},
                    status=400
                )
            logger.info(f"[RECONSTRUCT] Checksum verified: {calculated_checksum}")
        else:
            logger.warning("[RECONSTRUCT] Warning: No checksum in metadata (old format)")

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

    try:
        # Match the expiry time with OnlineEncryptedFile.expires_at (1 hour)
        token = signer.unsign(signed_token, max_age=3600)
    except SignatureExpired:
        return Response({"error": "Link has expired"}, status=410)
    except BadSignature:
        return Response({"error": "Invalid link"}, status=404)
    
    if not password:
        return Response({"error": "Password required"}, status=400)

    try:
        encrypted_file = OnlineEncryptedFile.objects.get(token=token)
    except OnlineEncryptedFile.DoesNotExist:
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

    if encrypted_file.download_count >= 3:
        log_audit(encrypted_file, ip, request, "FAILED", "Download limit reached")
        return Response({"error": "Download limit reached"}, status=429)

    try:
        decrypted = decrypt_file(encrypted_file.encrypted_data, password)

        encrypted_file.failed_attempts = 0
        encrypted_file.locked_until = None
    except Exception as e:
        encrypted_file.failed_attempts += 1
        if encrypted_file.failed_attempts >= MAX_ATTEMPTS:
            encrypted_file.locked_until = timezone.now() + timedelta(minutes=LOCK_DURATION)

        encrypted_file.save()
        log_audit(encrypted_file, ip, request, "FAILED", "Wrong password")
        return Response({"error": "Wrong password"}, status=400)

    encrypted_file.download_count += 1

    if encrypted_file.download_count >= 3:
        encrypted_file.delete()
    else:
        encrypted_file.save()


    log_audit(encrypted_file, ip, request, "SUCCESS", None)

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
