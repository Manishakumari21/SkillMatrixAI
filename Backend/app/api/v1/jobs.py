from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel

from app.api.v1.auth import get_current_user
from app.models.user import User
from app.models.resume import Resume
from app.services.job_api_service import get_all_jobs, search_jobs, get_categories
from app.services.skill_extraction_service import extract_skills
from app.services.skill_normalization_service import normalize_skills

router = APIRouter(prefix="/jobs", tags=["jobs"])


class JobMatchRequest(BaseModel):
    resume_id: str


@router.get("")
async def list_jobs(
    q: str = Query("", description="Search query"),
    tags: str = Query("", description="Comma-separated tags"),
    location: str = Query("", description="Location filter"),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
):
    tag_list = [t.strip() for t in tags.split(",") if t.strip()] if tags else []
    result = await search_jobs(
        query=q,
        tags=tag_list,
        location=location,
        page=page,
        per_page=per_page,
    )
    return result


@router.get("/categories")
async def list_categories():
    cats = await get_categories()
    return {"categories": cats}


@router.get("/{job_id}")
async def get_job(job_id: str):
    all_jobs = await get_all_jobs()
    for job in all_jobs:
        if job["id"] == job_id:
            return job
    return {"error": "Job not found"}


@router.post("/match")
async def match_jobs(
    payload: JobMatchRequest,
    current_user: User = Depends(get_current_user),
):
    resume = await Resume.get(payload.resume_id)
    if resume is None:
        return {"error": "Resume not found", "jobs": [], "total": 0}
    if resume.user_email != current_user.email:
        return {"error": "Not authorized", "jobs": [], "total": 0}

    resume_skills = await normalize_skills(resume.skills_found)
    resume_set = set(resume_skills)

    all_jobs = await get_all_jobs()

    matched_jobs = []
    for job in all_jobs:
        raw_tags = [t.lower() for t in job.get("tags", [])]
        job_tags = set(raw_tags)
        matched = list(resume_set & job_tags)
        total_tags = len(job_tags)

        if total_tags == 0:
            tag_score = 0
        else:
            tag_score = (len(matched) / total_tags) * 100

        if len(resume_set) == 0:
            resume_score = 0
        else:
            resume_score = (len(matched) / len(resume_set)) * 100

        score = round((tag_score * 0.6 + resume_score * 0.4), 1)

        missing = list(job_tags - resume_set)

        matched_jobs.append({
            **job,
            "match_score": score,
            "matched_skills": matched,
            "missing_skills": missing[:5],
        })

    matched_jobs.sort(key=lambda x: x["match_score"], reverse=True)

    return {
        "jobs": matched_jobs,
        "total": len(matched_jobs),
        "resume_skills": resume_skills,
    }
