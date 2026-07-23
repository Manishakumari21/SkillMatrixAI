from datetime import datetime, timezone

from beanie import Document
from pydantic import Field


class Portfolio(Document):
    user_email: str
    full_name: str = ""
    title: str = ""
    sections: dict = {}
    generated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "portfolios"
