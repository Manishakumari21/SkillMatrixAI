from datetime import datetime, timezone
from beanie import Document, Indexed
from pydantic import Field


class ActionVerb(Document):
    verb: Indexed(str, unique=True)
    category: str = "general"
    intensity: str = "medium"
    is_active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "action_verbs"
