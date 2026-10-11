from datetime import datetime, timezone

from beanie import Document, Indexed
from pydantic import EmailStr, Field


class User(Document):
    email: Indexed(EmailStr, unique=True)
    hashed_password: str | None = None
    full_name: str | None = None
    # Per-user third-party API keys, stored ENCRYPTED (see app/core/crypto.py).
    # Never store or return these in plaintext. Absent = user has no key and
    # AI features fall back to rule-based results.
    groq_api_key_encrypted: str | None = None
    gemini_api_key_encrypted: str | None = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "users"