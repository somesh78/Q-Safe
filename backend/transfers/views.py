from io import BytesIO
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from django.http import HttpResponse
from django.contrib.auth.models import User

from transfers.serializers import DownloadAuditSerializer
from .models import DownloadAudit, UploadSession, UploadedFile, OnlineEncryptedFile
from .services.encryption import encrypt_file, decrypt_file
from .services.qr_generator import generate_qr, generate_qr_url
from .services.chunking import chunk_bytes
from .services.zipper import create_zip
import base64, uuid,zipfile, json, base64
from pyzbar.pyzbar import decode as qr_decode
from PIL import Image as PILImage
from decouple import config
from django.utils import timezone
from django.utils.timezone import now, timedelta
from rest_framework.permissions import IsAuthenticated
from django.core.signing import TimestampSigner, BadSignature, SignatureExpired


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

    if User.objects.filter(username=username).exists():
        return Response({'error': 'Username already exists'}, status=400)

    user = User.objects.create_user(username=username, password=password)
    return Response({'message': 'Account created successfully'})


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

@permission_classes([IsAuthenticated])
@api_view(['POST'])
def upload_file(request):
    session_id = request.data.get("session_id")
    password = request.data.get("password")
    file = request.FILES.get("file")
    enable_ip_lock = request.data.get("enable_ip_lock") == "true"

    if not session_id or not file or not password:
        return Response({"error": "Session ID, file, and password are required"}, status=400)
    
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

        BASE_URL = config('FRONTEND_URL')
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
        password = request.data.get("password")
        encrypted_data = encrypt_file(file.read(), password )

        session.is_active = False
        session.save()

        chunks = chunk_bytes(encrypted_data)

        file_id = str(uuid.uuid4())
        qr_images = []
        metadata = {
            "original_filename": file.name,
            "content_type": file.content_type,
            "file_id": file_id,
            "total_chunks": len(chunks)
        }
        qr_images.append(("metadata.json", json.dumps(metadata).encode("utf-8")))
        for chunk in chunks:
            payload = {
                "file_id": file_id,
                "index": chunk["index"],
                "total": chunk["total"],
                "data": chunk["data"]
            }
            qr_png = generate_qr(payload)
            filename = f"qr_{chunk['index']:03}.png"
            qr_images.append((filename, qr_png))
        
        zip_bytes = create_zip(qr_images)

        response = HttpResponse(zip_bytes, content_type='application/zip')
        response['Content-Disposition'] = f'attachment; filename="offline_qr_{file.name}.zip"'
        return response

@permission_classes([IsAuthenticated])
@api_view(['POST'])
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
        print("RECONSTRUCTION ERROR:", e)
        return Response(
            {"error": f"Reconstruction failed: {str(e)}"},
            status=500
        )

MAX_ATTEMPTS = 5
LOCK_DURATION = 10

@api_view(["POST"])
@authentication_classes([])
@permission_classes([AllowAny])
def download_online_file(request, signed_token):
    password = request.data.get("password")
    ip = request.META.get("REMOTE_ADDR")

    try:
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
            return Response({"error": "This file is locked to a different device"}, status=403)

    if encrypted_file.locked_until and encrypted_file.locked_until < timezone.now():
        encrypted_file.failed_attempts = 0
        encrypted_file.locked_until = None
        encrypted_file.save()
    
    if encrypted_file.expires_at < timezone.now():
        log_audit(encrypted_file, ip, request, "FAILED", "Expired")
        return Response({"error": "Link has expired"}, status=410)

    if encrypted_file.download_count >= 3:
        log_audit(encrypted_file, ip, request, "FAILED", "Download limit reached")
        return Response({"error": "Download limit exceeded"}, status=429)

    try:
        decrypted = decrypt_file(encrypted_file.encrypted_data, password)

        encrypted_file.failed_attempts = 0
        encrypted_file.locked_until = None
    except:
        encrypted_file.failed_attempts += 1
        if encrypted_file.failed_attempts >= MAX_ATTEMPTS:
            encrypted_file.locked_until = timezone.now() + timedelta(minutes=LOCK_DURATION)

        encrypted_file.save()
        log_audit(encrypted_file, ip, request, "FAILED", "Wrong password")
        return Response({"error": "Wrong password"}, status=400)

    encrypted_file.download_count += 1
    encrypted_file.save()

    log_audit(encrypted_file, ip, request, "SUCCESS", None)

    response = HttpResponse(decrypted, content_type="application/octet-stream")
    response["Content-Disposition"] = f'attachment; filename="{encrypted_file.original_filename}"'
    return response

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def audit_logs(request):
    logs = DownloadAudit.objects.filter(
        file__session__user=request.user
    ).order_by('-timestamp')[:100]

    serializer = DownloadAuditSerializer(logs, many=True)
    return Response(serializer.data)
