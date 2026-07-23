from datetime import datetime, timezone
from beanie import Document, Indexed
from pydantic import Field


class DSAProblem(Document):
    problem_id: Indexed(str, unique=True)
    title: str
    description: str
    category: str
    difficulty: str
    tags: list[str] = []
    examples: list[dict] = []
    hints: list[str] = []
    solution_approach: str = ""
    solutions: dict = {}
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "dsa_problems"
