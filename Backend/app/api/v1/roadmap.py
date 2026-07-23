from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.core.config import get_settings
from app.api.v1.auth import get_current_user
from app.models.user import User
from app.models.resume import Resume
from app.models.user_progress import UserProgress
from app.services.roadmap_services import generate_roadmap
from app.services.visualization_service import generate_roadmap_demand_chart, generate_relevance_pie

settings = get_settings()
router = APIRouter(prefix="/roadmap", tags=["roadmap"])


class RoadmapRequest(BaseModel):
    resume_id: str
    job_descriptions: list[str]


@router.post("/generate")
async def generate_roadmap_endpoint(
    payload: RoadmapRequest,
    current_user: User = Depends(get_current_user),
):
    resume = await Resume.get(payload.resume_id)

    if resume is None:
        raise HTTPException(status_code=404, detail="Resume not found")

    if resume.user_email != current_user.email:
        raise HTTPException(status_code=403, detail="You do not have permission to access this resume")

    if len(payload.job_descriptions) == 0:
        raise HTTPException(status_code=400, detail="Provide at least one job description")

    result = await generate_roadmap(resume.skills_found, payload.job_descriptions)

    result["charts"] = {}

    if result.get("roadmap"):
        demand_chart = generate_roadmap_demand_chart(result["roadmap"])
        if demand_chart:
            result["charts"]["demand"] = demand_chart

    relevance = result.get("relevance_score", 0)
    relevance_chart = generate_relevance_pie(relevance)
    if relevance_chart:
        result["charts"]["relevance"] = relevance_chart

    skills_for_demand = [
        {"skill": item["skill"], "demand_percentage": item["demand_percentage"]}
        for item in result.get("roadmap", [])
    ]

    if skills_for_demand:
        progress = await UserProgress.find_one({"user_email": current_user.email})
        if progress:
            entry = {
                "skills": skills_for_demand,
                "timestamp": datetime.now(timezone.utc).isoformat(),
            }
            progress.demand_history.append(entry)
            if len(progress.demand_history) > settings.demand_history_cap:
                progress.demand_history = progress.demand_history[-settings.demand_history_cap:]
            progress.updated_at = datetime.now(timezone.utc)
            await progress.save()

    return result
