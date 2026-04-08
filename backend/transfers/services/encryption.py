from cryptography.fernet import Fernet
import base64, hashlib,os
import struct
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.backends import default_backend
from cryptography.hazmat.primitives.ciphers.aead import AESGCM

MAGIC_V2 = b"QSAFEV2\x00"
HEADER_SALT_LEN = 16
NONCE_LEN = 12
DEFAULT_CHUNK_SIZE = 1024 * 1024


class LegacyEncryptedFormatError(Exception):
    pass


class EncryptedStreamReader:
    def __init__(self, chunks_iterable):
        self._chunks = iter(chunks_iterable)
        self._buffer = bytearray()

    def read_exact(self, size: int) -> bytes:
        while len(self._buffer) < size:
            try:
                self._buffer.extend(next(self._chunks))
            except StopIteration as exc:
                raise EOFError("Unexpected EOF while reading encrypted stream") from exc

        data = bytes(self._buffer[:size])
        del self._buffer[:size]
        return data

    def read_exact_or_none(self, size: int):
        while len(self._buffer) < size:
            try:
                self._buffer.extend(next(self._chunks))
            except StopIteration:
                if not self._buffer:
                    return None
                raise EOFError("Unexpected EOF while reading encrypted stream")

        data = bytes(self._buffer[:size])
        del self._buffer[:size]
        return data

def derive_key(password: str, salt: bytes) -> bytes:
    kdf = PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        length=32,
        salt=salt,
        iterations=100000,
        backend=default_backend()
    )
    return base64.urlsafe_b64encode(kdf.derive(password.encode()))


def derive_raw_key(password: str, salt: bytes) -> bytes:
    kdf = PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        length=32,
        salt=salt,
        iterations=100000,
        backend=default_backend()
    )
    return kdf.derive(password.encode())


def is_v2_encrypted(encrypted: bytes) -> bool:
    if isinstance(encrypted, memoryview):
        encrypted = bytes(encrypted)
    return encrypted.startswith(MAGIC_V2)

def encrypt_file_chunks(chunks_iterable, password: str, chunk_size: int = DEFAULT_CHUNK_SIZE) -> bytes:
    salt = os.urandom(HEADER_SALT_LEN)
    key = derive_raw_key(password, salt)
    aesgcm = AESGCM(key)

    output = bytearray()
    output.extend(MAGIC_V2)
    output.extend(salt)
    output.extend(struct.pack("!I", chunk_size))

    for chunk in chunks_iterable:
        if not chunk:
            continue
        nonce = os.urandom(NONCE_LEN)
        ciphertext = aesgcm.encrypt(nonce, chunk, None)
        output.extend(nonce)
        output.extend(struct.pack("!I", len(ciphertext)))
        output.extend(ciphertext)

    return bytes(output)

def encrypt_file(data: bytes, password: str) -> bytes:
    return encrypt_file_chunks((data[i:i + DEFAULT_CHUNK_SIZE] for i in range(0, len(data), DEFAULT_CHUNK_SIZE)), password)


def decrypt_stream_chunks(chunks_iterable, password: str):
    reader = EncryptedStreamReader(chunks_iterable)

    magic = reader.read_exact(len(MAGIC_V2))
    if magic != MAGIC_V2:
        raise LegacyEncryptedFormatError("Legacy format is not stream-decryptable")

    salt = reader.read_exact(HEADER_SALT_LEN)
    _chunk_size = struct.unpack("!I", reader.read_exact(4))[0]

    key = derive_raw_key(password, salt)
    aesgcm = AESGCM(key)

    while True:
        nonce = reader.read_exact_or_none(NONCE_LEN)
        if nonce is None:
            break

        ciphertext_len = struct.unpack("!I", reader.read_exact(4))[0]
        ciphertext = reader.read_exact(ciphertext_len)
        yield aesgcm.decrypt(nonce, ciphertext, None)


def _decrypt_legacy(encrypted: bytes, password: str) -> bytes:
    salt = encrypted[:16]
    encrypted_data = encrypted[16:]
    key = derive_key(password, salt)
    f = Fernet(key)
    return f.decrypt(encrypted_data)

def decrypt_file(encrypted: bytes, password: str) -> bytes:
    # Convert memoryview to bytes if needed (PostgreSQL BinaryField returns memoryview)
    if isinstance(encrypted, memoryview):
        encrypted = bytes(encrypted)

    if is_v2_encrypted(encrypted):
        return b"".join(decrypt_stream_chunks([encrypted], password))

    return _decrypt_legacy(encrypted, password)