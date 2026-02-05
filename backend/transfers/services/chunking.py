import hashlib
import math
import base64

CHUNK_SIZE = 1800  # Safe size for QR v40: 1800 bytes -> ~2400 base64 -> ~2500 JSON (fits in 2953 limit)

def chunk_bytes(data: bytes):
    chunks = []
    total = math.ceil(len(data) / CHUNK_SIZE)

    for i in range(total):
        part = data[i * CHUNK_SIZE:(i + 1) * CHUNK_SIZE]
        chunks.append({
            "index": i,
            "total": total,
            "checksum": hashlib.sha256(part).hexdigest(),
            "data": base64.b64encode(part).decode()
        })
    
    return chunks