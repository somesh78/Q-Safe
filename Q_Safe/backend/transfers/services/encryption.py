from cryptography.fernet import Fernet
import base64, hashlib

def derive_key(password: str) -> bytes:
    hash = hashlib.sha256(password.encode()).digest()
    return base64.urlsafe_b64encode(hash)

def encrypt_file(data: bytes, password: str) -> bytes:
    key = derive_key(password)
    f = Fernet(key)
    encrypted = f.encrypt(data)
    return encrypted

def decrypt_file(encrypted: bytes, password: str) -> bytes:
    key = derive_key(password)
    f = Fernet(key)
    return f.decrypt(encrypted)
