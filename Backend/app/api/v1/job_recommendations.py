from fastapi import APIRouter, Depends
from pydantic import BaseModel

from app.core.config import get_settings
from app.api.v1.auth import get_current_user
from app.models.user import User
from app.models.resume import Resume
from app.services.job_api_service import get_all_jobs
from app.services.skill_extraction_service import extract_skills

settings = get_settings()
router = APIRouter(prefix="/job-recommendations", tags=["job-recommendations"])


class JobRecommendRequest(BaseModel):
    resume_id: str
    job_description: str = ""


def _compute_match_score(job_required, job_preferred, resume_skills):
    resume_set = set(s.lower() for s in resume_skills)
    required_set = set(s.lower() for s in job_required)
    preferred_set = set(s.lower() for s in job_preferred)

    required_matches = len(resume_set & required_set)
    preferred_matches = len(resume_set & preferred_set)

    total_required = len(required_set)
    if total_required == 0:
        return 0, []

    required_score = (required_matches / total_required) * settings.required_skills_weight
    preferred_score = (preferred_matches / max(len(preferred_set), 1)) * settings.preferred_skills_weight

    score = round(required_score + preferred_score, 1)

    matched = list(resume_set & (required_set | preferred_set))
    return score, matched


@router.post("")
async def get_job_recommendations(
    payload: JobRecommendRequest,
    current_user: User = Depends(get_current_user),
):
    resume = await Resume.get(payload.resume_id)
    if resume is None:
        return {"jobs": [], "total": 0}

    resume_skills = [s.lower() for s in resume.skills_found]

    jd_skills = []
    if payload.job_description.strip():
        jd_skills = await extract_skills(payload.job_description)

    all_jobs = await get_all_jobs()

    recommendations = []
    for job in all_jobs:
        job_tags = [t.lower() for t in job.get("tags", [])]

        if not job_tags:
            continue

        resume_set = set(resume_skills)
        job_set = set(job_tags)

        matched_skills = list(resume_set & job_set)
        score = round((len(matched_skills) / len(job_set)) * 100, 1) if job_set else 0

        missing_skills = list(job_set - resume_set)
        match_level = "strong"
        if score < settings.match_score_weak:
            match_level = "weak"
        elif score < settings.match_score_strong:
            match_level = "moderate"

        recommendations.append({
            "job_id": job["id"],
            "title": job["title"],
            "company": job["company"],
            "location": job["location"],
            "salary": job.get("salary", ""),
            "tags": job.get("tags", []),
            "description": job.get("description", ""),
            "url": job.get("url", ""),
            "source": job.get("source", ""),
            "posted_at": job.get("posted_at", ""),
            "match_score": score,
            "match_level": match_level,
            "matched_skills": matched_skills,
            "missing_skills": missing_skills,
            "skill_coverage": round(len(matched_skills) / len(job_set) * 100) if job_set else 0,
        })

    recommendations.sort(key=lambda x: x["match_score"], reverse=True)

    return {
        "jobs": recommendations,
        "total": len(recommendations),
        "resume_skills": resume_skills,
    }
