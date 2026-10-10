from datetime import datetime, timezone
from beanie import Document
from pydantic import Field


class JobApplication(Document):
    user_email: str
    job_id: str
    job_title: str = ""
    company: str = ""
    job_url: str = ""
    status: str = "saved"  # saved | applied | interview | offer | rejected
    notes: str = ""
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    applied_at: datetime | None = None

    class Settings:
        name = "job_applications"
