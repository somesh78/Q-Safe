import qrcode, io, json

def generate_qr(payload: dict) -> bytes:
    # Use QRCode with Low error correction for maximum data capacity (2953 bytes)
    qr = qrcode.QRCode(
        version=None,  # Auto-select version
        error_correction=qrcode.constants.ERROR_CORRECT_L,  # Low = max capacity
        box_size=10,
        border=4,
    )
    qr.add_data(json.dumps(payload))
    qr.make(fit=True)
    
    img = qr.make_image(fill_color="black", back_color="white")
    buffer = io.BytesIO()
    img.save(buffer, format='PNG')
    buffer.seek(0)
    return buffer.read()

def generate_qr_url(url: str) -> bytes:
    qr = qrcode.QRCode(
        version=None,
        error_correction=qrcode.constants.ERROR_CORRECT_Q,
        box_size=10,
        border=4,
    )
    qr.add_data(url)
    qr.make(fit=True)

    img = qr.make_image(fill_color="black", back_color="white")

    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()
