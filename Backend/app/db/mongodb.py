from beanie import init_beanie
from motor.motor_asyncio import AsyncIOMotorClient

from app.models.user import User
from app.models.resume import Resume
from app.models.user_progress import UserProgress
from app.models.skill import Skill
from app.models.dsa_problem import DSAProblem
from app.models.interview_question import InterviewQuestion
from app.models.learning_resource import LearningResource
from app.models.action_verb import ActionVerb
from app.models.portfolio import Portfolio
from app.core.config import get_settings
from app.core.logger import logger

settings = get_settings()

client: AsyncIOMotorClient | None = None

database_name = settings.db_name

documents_models = [
    User,
    Resume,
    UserProgress,
    Skill,
    DSAProblem,
    InterviewQuestion,
    LearningResource,
    ActionVerb,
    Portfolio,
]

async def init_db() -> None:
    global client

    if client is None:
        client = AsyncIOMotorClient(settings.mongo_uri)
        database = client[database_name]
        await init_beanie(database=database, document_models=documents_models)
        logger.info("MongoDB connected and Beanie initialized (db=%s)", database_name)


async def close_db() -> None:
    global client

    if client is not None:
        client.close()
        client = None
        logger.info("MongoDB connection closed")