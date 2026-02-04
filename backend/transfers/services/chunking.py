import hashlib
import math
import base64

CHUNK_SIZE = 2500  # Increased from 800 to reduce QR count and memory usage

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