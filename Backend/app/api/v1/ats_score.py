from fastapi import APIRouter, Depends
from pydantic import BaseModel

from app.api.v1.auth import get_current_user
from app.models.user import User
from app.models.resume import Resume
from app.services.ats_score_service import score_ats
from app.services.visualization_service import generate_ats_radar, generate_ats_gauge

router = APIRouter(prefix="/ats-score", tags=["ats-score"])


class ATSScoreRequest(BaseModel):
    resume_text: str = ""
    job_description: str = ""


class ATSScoreByIdRequest(BaseModel):
    resume_id: str
    job_description: str = ""


@router.post("/check")
async def check_ats_score(
    payload: ATSScoreRequest,
    current_user: User = Depends(get_current_user),
):
    if not payload.resume_text.strip():
        return {"error": "Resume text is required"}

    result = await score_ats(payload.resume_text, payload.job_description)

    result["charts"] = {}
    if result.get("breakdown"):
        radar = generate_ats_radar(result["breakdown"])
        if radar:
            result["charts"]["radar"] = radar
    gauge = generate_ats_gauge(result.get("overall_score", 0))
    if gauge:
        result["charts"]["gauge"] = gauge

    return result


@router.post("/check-by-id")
async def check_ats_score_by_id(
    payload: ATSScoreByIdRequest,
    current_user: User = Depends(get_current_user),
):
    resume = await Resume.get(payload.resume_id)
    if resume is None:
        return {"error": "Resume not found"}

    result = await score_ats(resume.extracted_text, payload.job_description)

    result["charts"] = {}
    if result.get("breakdown"):
        radar = generate_ats_radar(result["breakdown"])
        if radar:
            result["charts"]["radar"] = radar
    gauge = generate_ats_gauge(result.get("overall_score", 0))
    if gauge:
        result["charts"]["gauge"] = gauge

    return result
