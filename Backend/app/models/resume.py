from datetime import datetime, timezone
from beanie import Document
from pydantic import Field


class Resume(Document):
    user_email: str
    original_filename: str
    extracted_text: str
    extraction_method: str
    skills_found: list[str] = []
    uploaded_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "resumes"
