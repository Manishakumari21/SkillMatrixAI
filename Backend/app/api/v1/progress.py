from datetime import datetime, timezone

from fastapi import APIRouter, Depends
from pydantic import BaseModel

from app.core.config import get_settings
from app.api.v1.auth import get_current_user
from app.models.user import User
from app.models.user_progress import UserProgress
from app.models.resume import Resume

settings = get_settings()
router = APIRouter(prefix="/progress", tags=["progress"])


async def get_or_create_progress(user_email: str) -> UserProgress:
    progress = await UserProgress.find_one({"user_email": user_email})
    if progress is None:
        progress = UserProgress(user_email=user_email)
        await progress.insert()
    return progress


class LearnSkillRequest(BaseModel):
    skill: str


class UnlearnSkillRequest(BaseModel):
    skill: str


class RecordDemandRequest(BaseModel):
    skills: list[dict]


@router.get("")
async def get_progress(current_user: User = Depends(get_current_user)):
    progress = await get_or_create_progress(current_user.email)

    resume_count = await Resume.find({"user_email": current_user.email}).count()

    return {
        "resume_count": progress.resume_count or resume_count,
        "last_resume_filename": progress.last_resume_filename,
        "last_resume_skills": progress.last_resume_skills,
        "gap_analyses_count": len(progress.gap_analyses),
        "gap_analyses": progress.gap_analyses,
        "last_gap_result": progress.gap_analyses[-1] if progress.gap_analyses else None,
        "learned_skills": progress.learned_skills,
        "learned_skills_history": progress.learned_skills_history,
        "demand_history": progress.demand_history,
        "interview_questions_count": progress.interview_questions_count,
    }


@router.get("/skill-trend")
async def get_skill_trend(current_user: User = Depends(get_current_user)):
    progress = await get_or_create_progress(current_user.email)

    match_trend = [
        {
            "match_percentage": entry["match_percentage"],
            "timestamp": entry["timestamp"],
        }
        for entry in progress.gap_analyses
    ]

    skill_timeline = [
        {
            "skill": entry["skill"],
            "learned_at": entry["learned_at"],
        }
        for entry in progress.learned_skills_history
    ]

    latest_demand = progress.demand_history[-1] if progress.demand_history else None
    demand_trend = []
    if latest_demand:
        demand_trend = latest_demand.get("skills", [])

    all_demand_snapshots = [
        {
            "skills": snap.get("skills", []),
            "timestamp": snap.get("timestamp", ""),
        }
        for snap in progress.demand_history
    ]

    return {
        "match_trend": match_trend,
        "skill_timeline": skill_timeline,
        "demand_trend": demand_trend,
        "all_demand_snapshots": all_demand_snapshots,
        "total_learned": len(progress.learned_skills),
        "total_gap_analyses": len(progress.gap_analyses),
        "total_demand_snapshots": len(progress.demand_history),
    }


@router.post("/record-resume")
async def record_resume_upload(
    filename: str,
    skills: list[str],
    current_user: User = Depends(get_current_user),
):
    progress = await get_or_create_progress(current_user.email)
    progress.resume_count += 1
    progress.last_resume_filename = filename
    progress.last_resume_skills = skills
    progress.updated_at = datetime.now(timezone.utc)
    await progress.save()
    return {"status": "recorded"}


@router.post("/record-gap")
async def record_gap_analysis(
    match_percentage: float,
    matched_count: int,
    missing_count: int,
    missing_skills: list[str],
    matched_skills: list[str] = None,
    current_user: User = Depends(get_current_user),
):
    if matched_skills is None:
        matched_skills = []
    progress = await get_or_create_progress(current_user.email)
    entry = {
        "match_percentage": match_percentage,
        "matched_count": matched_count,
        "missing_count": missing_count,
        "missing_skills": missing_skills,
        "matched_skills": matched_skills,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
    progress.gap_analyses.append(entry)
    if len(progress.gap_analyses) > settings.gap_analyses_cap:
        progress.gap_analyses = progress.gap_analyses[-settings.gap_analyses_cap:]
    progress.updated_at = datetime.now(timezone.utc)
    await progress.save()
    return {"status": "recorded"}


@router.post("/record-demand")
async def record_demand(
    payload: RecordDemandRequest,
    current_user: User = Depends(get_current_user),
):
    progress = await get_or_create_progress(current_user.email)
    entry = {
        "skills": payload.skills,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
    progress.demand_history.append(entry)
    if len(progress.demand_history) > settings.demand_history_cap:
        progress.demand_history = progress.demand_history[-settings.demand_history_cap:]
    progress.updated_at = datetime.now(timezone.utc)
    await progress.save()
    return {"status": "recorded"}


@router.post("/record-interview")
async def record_interview(current_user: User = Depends(get_current_user)):
    progress = await get_or_create_progress(current_user.email)
    progress.interview_questions_count += 1
    progress.updated_at = datetime.now(timezone.utc)
    await progress.save()
    return {"status": "recorded"}


@router.post("/learn-skill")
async def learn_skill(
    payload: LearnSkillRequest,
    current_user: User = Depends(get_current_user),
):
    progress = await get_or_create_progress(current_user.email)
    if payload.skill not in progress.learned_skills:
        progress.learned_skills.append(payload.skill)
        progress.learned_skills_history.append({
            "skill": payload.skill,
            "learned_at": datetime.now(timezone.utc).isoformat(),
        })
        progress.updated_at = datetime.now(timezone.utc)
        await progress.save()
    return {"status": "learned", "learned_skills": progress.learned_skills}


@router.post("/unlearn-skill")
async def unlearn_skill(
    payload: UnlearnSkillRequest,
    current_user: User = Depends(get_current_user),
):
    progress = await get_or_create_progress(current_user.email)
    if payload.skill in progress.learned_skills:
        progress.learned_skills.remove(payload.skill)
        progress.learned_skills_history = [
            h for h in progress.learned_skills_history if h["skill"] != payload.skill
        ]
        progress.updated_at = datetime.now(timezone.utc)
        await progress.save()
    return {"status": "unlearned", "learned_skills": progress.learned_skills}
