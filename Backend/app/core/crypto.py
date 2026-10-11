import base64
import hashlib

from cryptography.fernet import Fernet, InvalidToken
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC

from app.core.config import get_settings

_SALT = b"skillmatrixai-user-api-keys-v1"
_KDF_ITERATIONS = 480_000

_cipher = None

def _get_cipher() -> Fernet:

    global _cipher
    if _cipher is None:
        settings = get_settings()
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=_SALT,
            iterations=_KDF_ITERATIONS,
        )
        derived = kdf.derive(settings.jwt_secret.encode("utf-8"))
        _cipher = Fernet(base64.urlsafe_b64encode(derived))
    return _cipher

def encrypt_key(plaintext: str) -> str:

    if plaintext is None:
        return None
    return _get_cipher().encrypt(plaintext.encode("utf-8")).decode("utf-8")

def decrypt_key(ciphertext: str | None) -> str | None:

    if not ciphertext:
        return None
    try:
        return _get_cipher().decrypt(ciphertext.encode("utf-8")).decode("utf-8")
    except (InvalidToken, ValueError, TypeError):
        return None

def mask_key(plaintext: str | None) -> str | None:

    if not plaintext:
        return None
    if len(plaintext) <= 8:
        return "*" * len(plaintext)
    return f"{plaintext[:4]}...{plaintext[-4:]}"
