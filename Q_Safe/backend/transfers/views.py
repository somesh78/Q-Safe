from io import BytesIO
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from django.http import HttpResponse
from .models import UploadSession, UploadedFile, OnlineEncryptedFile
from .services.encryption import encrypt_file, decrypt_file
from .services.qr_generator import generate_qr, generate_qr_url
from .services.chunking import chunk_bytes
from .services.zipper import create_zip
import base64, uuid,zipfile, json, base64
from pyzbar.pyzbar import decode as qr_decode
from PIL import Image as PILImage


@api_view(['POST'])
def create_session(request):
    mode = request.data.get('mode')
    if mode not in ['ONLINE', 'OFFLINE']:
        return Response({'error': 'Mode must be Online or Offline'}, status=400)
    session = UploadSession.objects.create(mode=mode)
    return Response({
        'session_id': str(session.session_id),
        'mode': session.mode, 
        'created_at': session.created_at
        })

@api_view(['POST'])
def upload_file(request):
    session_id = request.data.get('session_id')
    file= request.FILES.get('file')

    if not session_id or not file:
        return Response({'error': 'Session ID and file are required'}, status=400)
    
    try:
        session = UploadSession.objects.get(session_id=session_id, is_active=True)
    except UploadSession.DoesNotExist:
        return Response({'error': 'Invalid or inactive session ID'}, status=404)
    
    uploaded = UploadedFile.objects.create(
        session=session,
        original_filename=file.name,
        size=file.size
    )

    return Response({
        "message": "File uploaded successfully",
        "session_id": str(session.session_id),
        "mode": session.mode,
        "filename": uploaded.original_filename,
        "size": uploaded.size
    })

@api_view(['POST'])
def upload_file(request):
    session_id = request.data.get("session_id")
    password = request.data.get("password")
    file = request.FILES.get("file")

    if not session_id or not file or not password:
        return Response({"error": "Session ID, file, and password are required"}, status=400)
    
    try:
        session = UploadSession.objects.get(session_id=session_id, is_active=True)
    except UploadSession.DoesNotExist:
        return Response({"error": "Invalid or inactive session ID"}, status=404)
    
    # Online mode
    if session.mode == "ONLINE":
        password = request.data.get("password")

        if not password:
            return Response({"error": "Password is required for online mode"}, status=400)
        
        encrypted_data = encrypt_file(file.read(), password)
        encrypted_file = OnlineEncryptedFile.objects.create(
            session=session,
            encrypted_data=encrypted_data,
            token=uuid.uuid4(),
            original_filename=file.name
        )

        BASE_URL = "172.16.179.195:3000"
        download_url = f"http://{BASE_URL}/download/{encrypted_file.token}/"
        qr_bytes = generate_qr_url(download_url)
        qr_base64 = base64.b64encode(qr_bytes).decode()

        return Response({
            "message": "File uploaded and encrypted successfully",
            "filename": encrypted_file.original_filename,
            "mode": session.mode,
            "download_url": download_url,
            "qr_code": qr_base64
        })
    
    # Offline mode
    if session.mode == "OFFLINE":
        password = request.data.get("password")
        encrypted_data = encrypt_file(file.read(), password )
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

@api_view(['POST'])
def reconstruct_from_zip(request):
    print("FILES:", request.FILES)
    print("DATA:", request.data)

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


# @api_view(['GET'])
# def download_file(request, token):
#     try:
#         encrypted_file = OnlineEncryptedFile.objects.get(token=token)
#     except OnlineEncryptedFile.DoesNotExist:
#         return Response({"error": "Invalid download link"}, status=404)
    
#     # decrypted_data = decrypt_file(encrypted_file.encrypted_data, encrypted_file.encryption_key)

#     respnonse = HttpResponse(encrypted_file.encrypted_data, content_type='application/octet-stream')
#     respnonse['Content-Disposition'] = f'attachment; filename="{encrypted_file.original_filename}.enc"'
#     return respnonse

@api_view(["POST"])
@authentication_classes([])
@permission_classes([AllowAny])
def download_online_file(request, token):
    password = request.data.get("password")

    if not password:
        return Response({"error": "Password required"}, status=400)

    try:
        encrypted_file = OnlineEncryptedFile.objects.get(token=token)
    except OnlineEncryptedFile.DoesNotExist:
        return Response({"error": "Invalid link"}, status=404)

    try:
        decrypted = decrypt_file(encrypted_file.encrypted_data, password)
    except:
        return Response({"error": "Wrong password"}, status=403)

    response = HttpResponse(decrypted, content_type="application/octet-stream")
    response["Content-Disposition"] = f'attachment; filename="{encrypted_file.original_filename}"'
    return response
