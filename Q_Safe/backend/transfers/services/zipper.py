import zipfile, io

def create_zip(qr_images: list) -> bytes:
    zip_buffer = io.BytesIO()
    with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for name, data in qr_images:
            zipf.writestr(name, data)
    zip_buffer.seek(0)
    return zip_buffer.read()