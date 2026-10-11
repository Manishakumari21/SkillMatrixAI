import hashlib
import secrets
from datetime import datetime, timedelta, timezone

from beanie import Document, Indexed
from pydantic import Field

from app.core.config import get_settings

settings = get_settings()

def _as_utc(value: datetime) -> datetime:

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

    token_hash = _hash_token(raw_token)
    doc = await PasswordResetToken.find_one(PasswordResetToken.token_hash == token_hash)

    if doc is None or not doc.is_valid():
        return None

    await doc.delete()

    await PasswordResetToken.find(
        PasswordResetToken.user_email == doc.user_email
    ).delete_many()

    return doc.user_email

async def purge_expired_tokens() -> int:

    result = await PasswordResetToken.delete_all(
        {"expires_at": {"$lte": datetime.now(timezone.utc).replace(tzinfo=None)}}
    )
    return result.deleted_count

def build_reset_url(raw_token: str) -> str:
    return f"{settings.frontend_url.rstrip('/')}/reset-password?token={raw_token}"
