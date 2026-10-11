"""Symmetric encryption for user-supplied third-party API keys.

Keys are encrypted with Fernet (AES-128-CBC + HMAC-SHA256) using a key derived
from the app's JWT_SECRET via PBKDF2-HMAC-SHA256. Storing the ciphertext means a
leaked `users` collection does not hand over anybody's API keys in plaintext.

Threat model notes:
- The encryption key is derived from JWT_SECRET, so a deployment MUST keep
  JWT_SECRET stable and secret. Rotating it invalidates every stored key
  (users must re-enter them) — this is the safe failure mode.
- Ciphertext is only ever decrypted server-side, immediately before a call.
- Nothing in this module logs or returns plaintext key material.
"""
import base64
import hashlib

from cryptography.fernet import Fernet, InvalidToken
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC

from app.core.config import get_settings

# Fixed salt: this is a KDF work factor, not a secret. Deriving a stable key
# from JWT_SECRET is what lets ciphertext survive process restarts.
_SALT = b"skillmatrixai-user-api-keys-v1"
_KDF_ITERATIONS = 480_000

_cipher = None


def _get_cipher() -> Fernet:
    """Build (once) and return the Fernet instance for this process."""
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
    """Encrypt a user-supplied API key for storage."""
    if plaintext is None:
        return None
    return _get_cipher().encrypt(plaintext.encode("utf-8")).decode("utf-8")


def decrypt_key(ciphertext: str | None) -> str | None:
    """Decrypt a stored API key.

    Returns None when the value is missing or can no longer be decrypted (for
    example after JWT_SECRET was rotated), so callers fall back gracefully
    instead of crashing on every request.
    """
    if not ciphertext:
        return None
    try:
        return _get_cipher().decrypt(ciphertext.encode("utf-8")).decode("utf-8")
    except (InvalidToken, ValueError, TypeError):
        return None


def mask_key(plaintext: str | None) -> str | None:
    """Return a non-reversible hint for display, e.g. 'gsk_…ab12'.

    Only ever a prefix and the final 4 characters, so the response body can
    confirm which key is stored without disclosing it.
    """
    if not plaintext:
        return None
    if len(plaintext) <= 8:
        return "*" * len(plaintext)
    return f"{plaintext[:4]}...{plaintext[-4:]}"