from datetime import datetime, timezone
from beanie import Document, Indexed
from pydantic import Field


class InterviewQuestion(Document):
    question_id: Indexed(str, unique=True)
    role: str
    topic: str
    difficulty: str
    question_text: str
    answer_hint: str = ""
    tags: list[str] = []
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "interview_questions"
