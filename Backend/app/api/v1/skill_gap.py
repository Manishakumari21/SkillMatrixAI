from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.core.config import get_settings
from app.api.v1.auth import get_current_user
from app.models.user import User
from app.models.resume import Resume
from app.models.user_progress import UserProgress
from app.services.skill_extraction_service import extract_skills
from app.services.gap_analysis_service import analyze_gap, analyze_gap_semantic
from app.services.visualization_service import generate_skill_gap_chart, generate_skill_match_bars, generate_radar_chart
from datetime import datetime, timezone

settings = get_settings()
router = APIRouter(prefix="/skill-gap", tags=["skill-gap"])


class GapRequest(BaseModel):
    resume_id: str
    job_description: str


@router.post("/compare")
async def compare_skill_gap(
    payload: GapRequest,
    current_user: User = Depends(get_current_user),
):
    resume = await Resume.get(payload.resume_id)

    if resume is None:
        raise HTTPException(status_code=404, detail="Resume not found")

    if resume.user_email != current_user.email:
        raise HTTPException(status_code=403, detail="You do not have permission to access this resume")

    job_skills = await extract_skills(payload.job_description)
    result = analyze_gap(resume.skills_found, job_skills)

    result["charts"] = {}
    coverage_chart = generate_skill_gap_chart(
        result.get("matched_skills", []),
        result.get("missing_skills", []),
    )
    if coverage_chart:
        result["charts"]["coverage"] = coverage_chart

    radar = generate_radar_chart(
        result.get("matched_skills", []),
        result.get("missing_skills", []),
        job_skills,
    )
    if radar:
        result["charts"]["radar"] = radar

    progress = await UserProgress.find_one({"user_email": current_user.email})
    if progress:
        entry = {
            "match_percentage": result.get("match_percentage", 0),
            "matched_count": len(result.get("matched_skills", [])),
            "missing_count": len(result.get("missing_skills", [])),
            "missing_skills": result.get("missing_skills", []),
            "matched_skills": result.get("matched_skills", []),
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
        progress.gap_analyses.append(entry)
        if len(progress.gap_analyses) > settings.gap_analyses_cap:
            progress.gap_analyses = progress.gap_analyses[-settings.gap_analyses_cap:]
        progress.updated_at = datetime.now(timezone.utc)
        await progress.save()

    return result


@router.post("/compare-semantic")
async def compare_skill_gap_semantic(
    payload: GapRequest,
    current_user: User = Depends(get_current_user),
):
    resume = await Resume.get(payload.resume_id)

    if resume is None:
        raise HTTPException(status_code=404, detail="Resume not found")

    if resume.user_email != current_user.email:
        raise HTTPException(status_code=403, detail="You do not have permission to access this resume")

    job_skills = await extract_skills(payload.job_description)
    result = analyze_gap_semantic(resume.skills_found, job_skills)

    result["charts"] = {}

    if result.get("skill_details"):
        match_bars = generate_skill_match_bars(result["skill_details"])
        if match_bars:
            result["charts"]["skill_bars"] = match_bars

    coverage_chart = generate_skill_gap_chart(
        result.get("matched_skills", []),
        result.get("missing_skills", []),
        result.get("semantic_matches"),
    )
    if coverage_chart:
        result["charts"]["coverage"] = coverage_chart

    radar = generate_radar_chart(
        result.get("matched_skills", []),
        result.get("missing_skills", []),
        job_skills,
    )
    if radar:
        result["charts"]["radar"] = radar

    progress = await UserProgress.find_one({"user_email": current_user.email})
    if progress:
        entry = {
            "match_percentage": result.get("match_percentage", 0),
            "matched_count": len(result.get("matched_skills", [])),
            "missing_count": len(result.get("missing_skills", [])),
            "missing_skills": result.get("missing_skills", []),
            "matched_skills": result.get("matched_skills", []),
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
        progress.gap_analyses.append(entry)
        if len(progress.gap_analyses) > settings.gap_analyses_cap:
            progress.gap_analyses = progress.gap_analyses[-settings.gap_analyses_cap:]
        progress.updated_at = datetime.now(timezone.utc)
        await progress.save()

    return result
