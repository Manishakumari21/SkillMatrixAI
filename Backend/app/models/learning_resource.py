from datetime import datetime, timezone
from beanie import Document, Indexed
from pydantic import Field


class LearningResource(Document):
    skill: Indexed(str, unique=True)
    docs_url: str = ""
    youtube_url: str = ""
    course_url: str = ""
    course_name: str = ""
    course_provider: str = ""
    certificate: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "learning_resources"
