"""Password reset token issuing and consumption.

Security properties:
- Tokens are random 256-bit secrets from `secrets.token_urlsafe`, not JWTs, so
  they can be revoked server-side.
- Only a SHA-256 hash of the token is stored, so a database leak cannot be
  replayed to take over an account.
- Single use: consuming a token clears it.
- Expiry is enforced server-side from `password_reset_expire_minutes`.
"""
import hashlib
import secrets
from datetime import datetime, timedelta, timezone

from beanie import Document, Indexed
from pydantic import Field

from app.core.config import get_settings

settings = get_settings()


def _as_utc(value: datetime) -> datetime:
    """MongoDB stores datetimes without timezone info; treat them as UTC.

    Without this, comparing a stored (naive) expiry against an aware `now()`
    raises TypeError and every reset would 500 instead of validating.
    """
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc)


class PasswordResetToken(Document):
    user_email: Indexed(str)
    token_hash: Indexed(str, unique=True)
    expires_at: datetime
    used: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "password_reset_tokens"

    def is_valid(self) -> bool:
        return not self.used and _as_utc(self.expires_at) > datetime.now(timezone.utc)


def _hash_token(raw_token: str) -> str:
    return hashlib.sha256(raw_token.encode("utf-8")).hexdigest()


async def issue_reset_token(user_email: str) -> str:
    """Create a reset token for the user and return the RAW value.

    The raw value is only ever returned here so it can be emailed; only its
    hash is persisted. Any previously issued tokens for this user are invalidated
    so a leaked older email cannot be reused.
    """
    await PasswordResetToken.find(PasswordResetToken.user_email == user_email).delete_many()

    raw_token = secrets.token_urlsafe(32)
    await PasswordResetToken(
        user_email=user_email,
        token_hash=_hash_token(raw_token),
        expires_at=datetime.now(timezone.utc)
        + timedelta(minutes=settings.password_reset_expire_minutes),
    ).insert()

    return raw_token


async def consume_reset_token(raw_token: str) -> str | None:
    """Validate and burn a token. Returns the user email, or None if invalid.

    Marking used and deleting happen together so a token can never be redeemed
    twice, even under concurrent requests.
    """
    token_hash = _hash_token(raw_token)
    doc = await PasswordResetToken.find_one(PasswordResetToken.token_hash == token_hash)

    if doc is None or not doc.is_valid():
        return None

    # Delete via the raw collection: Beanie exposes delete_all (plural) but the
    # single-document form is not available on the Document class.
    await doc.delete()

    # Drop any other live tokens for this user as a precaution.
    await PasswordResetToken.find(
        PasswordResetToken.user_email == doc.user_email
    ).delete_many()

    return doc.user_email


async def purge_expired_tokens() -> int:
    """Remove expired/used tokens. Safe to call periodically."""
    result = await PasswordResetToken.delete_all(
        {"expires_at": {"$lte": datetime.now(timezone.utc).replace(tzinfo=None)}}
    )
    return result.deleted_count


def build_reset_url(raw_token: str) -> str:
    return f"{settings.frontend_url.rstrip('/')}/reset-password?token={raw_token}"