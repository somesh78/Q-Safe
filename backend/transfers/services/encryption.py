from cryptography.fernet import Fernet
import base64, hashlib,os
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.backends import default_backend

def derive_key(password: str, salt: bytes) -> bytes:
    kdf = PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        length=32,
        salt=salt,
        iterations=100000,
        backend=default_backend()
    )
    return base64.urlsafe_b64encode(kdf.derive(password.encode()))

def encrypt_file(data: bytes, password: str) -> bytes:
    salt = os.urandom(16)
    key = derive_key(password, salt)
    f = Fernet(key)
    encrypted = f.encrypt(data)
    return salt + encrypted

def decrypt_file(encrypted: bytes, password: str) -> bytes:
    salt = encrypted[:16]
    encrypted_data = encrypted[16:]
    key = derive_key(password, salt)
    f = Fernet(key)
    return f.decrypt(encrypted_data)