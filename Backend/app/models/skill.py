from datetime import datetime, timezone
from beanie import Document, Indexed
from pydantic import Field


class Skill(Document):
    name: Indexed(str, unique=True)
    category: str = ""
    aliases: list[str] = []
    is_active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "skills"
