from fastapi import APIRouter, Depends
from pydantic import BaseModel

from app.api.v1.auth import get_current_user
from app.models.user import User
from app.services.learning_resources import get_learning_resources

router = APIRouter(prefix="/learning-resources", tags=["learning-resources"])


class LearningResourceRequest(BaseModel):
    skills: list[str]


@router.post("")
async def get_resources(
    payload: LearningResourceRequest,
    current_user: User = Depends(get_current_user),
):
    return {"resources": await get_learning_resources(payload.skills)}
