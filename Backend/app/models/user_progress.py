from datetime import datetime, timezone
from beanie import Document
from pydantic import Field


class UserProgress(Document):
    user_email: str
    resume_count: int = 0
    last_resume_filename: str = ""
    last_resume_skills: list[str] = []
    gap_analyses: list[dict] = []
    learned_skills: list[str] = []
    learned_skills_history: list[dict] = []
    demand_history: list[dict] = []
    interview_questions_count: int = 0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "user_progress"
