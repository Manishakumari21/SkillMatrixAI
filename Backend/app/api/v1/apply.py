import re

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel

from app.api.v1.auth import get_current_user
from app.models.user import User
from app.models.resume import Resume
from app.models.job_application import JobApplication
from app.services.llm_service import call_ai_api_safe
from app.core.logger import logger

router = APIRouter(prefix="/apply", tags=["apply"])

VALID_STATUSES = {"saved", "applied", "interview", "offer", "rejected"}


class TrackRequest(BaseModel):
    job_id: str
    job_title: str = ""
    company: str = ""
    job_url: str = ""
    notes: str = ""


class StatusRequest(BaseModel):
    status: str
    notes: str = ""


class AnswerRequest(BaseModel):
    question: str
    job_title: str = ""
    company: str = ""
    job_description: str = ""


class HRContactRequest(BaseModel):
    company: str
    domain: str = ""


def _extract_profile(text: str) -> dict:
    email_m = re.search(r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}", text)
    phone_m = re.search(r"(\+?\d[\d\s\-()]{7,}\d)", text)
    linkedin_m = re.search(r"(linkedin\.com/\S+)", text, re.IGNORECASE)
    github_m = re.search(r"(github\.com/\S+)", text, re.IGNORECASE)
    lines = [l.strip() for l in text.splitlines() if l.strip()]
    name = lines[0][:80] if lines else ""
    return {
        "full_name": name,
        "email": email_m.group(0) if email_m else "",
        "phone": phone_m.group(0).strip() if phone_m else "",
        "linkedin": linkedin_m.group(0) if linkedin_m else "",
        "github": github_m.group(0) if github_m else "",
    }


@router.get("/profile")
async def apply_profile(current_user: User = Depends(get_current_user)):
    """One-time resume extraction → reusable autofill profile. Fill once, reuse everywhere."""
    resume = await Resume.find_one(
        {"user_email": current_user.email}, sort=[("uploaded_at", -1)]
    )
    if not resume:
        raise HTTPException(status_code=404, detail="Upload a resume first")
    profile = _extract_profile(resume.extracted_text or "")
    profile["skills"] = resume.skills_found or []
    profile["resume_id"] = str(resume.id)
    return profile


@router.post("/track")
async def track_application(payload: TrackRequest, current_user: User = Depends(get_current_user)):
    existing = await JobApplication.find_one(
        {"user_email": current_user.email, "job_id": payload.job_id}
    )
    if existing:
        return {"application_id": str(existing.id), "status": existing.status, "duplicate": True}
    app = JobApplication(
        user_email=current_user.email,
        job_id=payload.job_id,
        job_title=payload.job_title,
        company=payload.company,
        job_url=payload.job_url,
        notes=payload.notes,
    )
    await app.insert()
    logger.info("Application tracked: user=%s job=%s", current_user.email, payload.job_id)
    return {"application_id": str(app.id), "status": app.status, "duplicate": False}


@router.get("/list")
async def list_applications(
    status: str = Query("", description="Filter by status"),
    current_user: User = Depends(get_current_user),
):
    query = {"user_email": current_user.email}
    if status:
        if status not in VALID_STATUSES:
            raise HTTPException(status_code=400, detail=f"Invalid status. Use: {sorted(VALID_STATUSES)}")
        query["status"] = status
    apps = await JobApplication.find(query, sort=[("created_at", -1)]).to_list()
    return {
        "applications": [
            {
                "application_id": str(a.id),
                "job_id": a.job_id,
                "job_title": a.job_title,
                "company": a.company,
                "job_url": a.job_url,
                "status": a.status,
                "notes": a.notes,
                "created_at": a.created_at.isoformat(),
                "applied_at": a.applied_at.isoformat() if a.applied_at else None,
            }
            for a in apps
        ],
        "total": len(apps),
    }


@router.patch("/{application_id}")
async def update_status(application_id: str, payload: StatusRequest, current_user: User = Depends(get_current_user)):
    if payload.status not in VALID_STATUSES:
        raise HTTPException(status_code=400, detail=f"Invalid status. Use: {sorted(VALID_STATUSES)}")
    app = await JobApplication.get(application_id)
    if not app or app.user_email != current_user.email:
        raise HTTPException(status_code=404, detail="Application not found")
    from datetime import datetime, timezone
    app.status = payload.status
    if payload.notes:
        app.notes = payload.notes
    if payload.status == "applied" and not app.applied_at:
        app.applied_at = datetime.now(timezone.utc)
    await app.save()
    return {"application_id": str(app.id), "status": app.status}


@router.delete("/{application_id}")
async def delete_application(application_id: str, current_user: User = Depends(get_current_user)):
    app = await JobApplication.get(application_id)
    if not app or app.user_email != current_user.email:
        raise HTTPException(status_code=404, detail="Application not found")
    await app.delete()
    return {"status": "deleted"}


@router.post("/answer")
async def draft_answer(payload: AnswerRequest, current_user: User = Depends(get_current_user)):
    """Draft an answer to a screening/application question from the user's resume."""
    if not payload.question.strip():
        raise HTTPException(status_code=400, detail="Question is required")
    resume = await Resume.find_one(
        {"user_email": current_user.email}, sort=[("uploaded_at", -1)]
    )
    resume_text = (resume.extracted_text or "")[:3000] if resume else ""
    skills = ", ".join((resume.skills_found or [])[:15]) if resume else ""
    prompt = (
        "You help a job seeker answer an application screening question honestly, "
        "using only their resume background below. If the resume lacks relevant experience, "
        "say so briefly and suggest a truthful framing — never invent jobs or years.\n\n"
        f"Resume skills: {skills}\nResume excerpt: {resume_text}\n\n"
        f"Job: {payload.job_title} at {payload.company}\n"
        f"JD excerpt: {payload.job_description[:1000]}\n"
        f"Question: {payload.question}\n\n"
        "Draft a 3-6 sentence first-person answer the applicant can paste and edit."
    )
    draft = call_ai_api_safe(prompt)
    if not draft:
        # Deterministic fallback so the endpoint works without LLM keys
        draft = (
            f"For '{payload.question}': highlight your experience in {skills or 'your listed skills'} "
            f"relevant to the {payload.job_title or 'role'}. Edit this draft with one concrete "
            "project, metric, and tool before submitting."
        )
        return {"draft": draft, "source": "template_fallback"}
    return {"draft": draft.strip(), "source": "llm"}


@router.post("/hr-contact")
async def hr_contact_helper(payload: HRContactRequest):
    """Guide the user to official company channels — no scraped personal data.

    We deliberately do NOT return scraped HR emails/phone numbers (privacy +
    accuracy risk). Instead we return official-page deep links + common
    corporate email patterns the user can verify themselves.
    """
    company = payload.company.strip()
    if not company:
        raise HTTPException(status_code=400, detail="Company is required")
    q = company.replace(" ", "+")
    domain_hint = payload.domain.strip() or f"{company.lower().replace(' ', '')}.com"
    return {
        "company": company,
        "official_channels": [
            {"label": "Careers page", "url": f"https://www.google.com/search?q={q}+careers+official+site"},
            {"label": "LinkedIn company page", "url": f"https://www.linkedin.com/search/results/companies/?keywords={q}"},
            {"label": "Contact / HR page", "url": f"https://www.google.com/search?q={q}+HR+contact+official"},
        ],
        "email_patterns_to_verify": [
            f"careers@{domain_hint}",
            f"hr@{domain_hint}",
            f"jobs@{domain_hint}",
        ],
        "outreach_template": (
            f"Subject: Application — [Role] | [Your Name]\n\n"
            f"Hi {company} hiring team,\n\n"
            "I recently applied for [Role] ([Job link/ID]). "
            "I'm a [1-line background] with strengths in [2-3 skills]. "
            "Attaching my resume for reference — happy to share work samples.\n\n"
            "Best regards,\n[Name] | [Phone] | [LinkedIn]"
        ),
        "disclaimer": "Verify every address on the company's official site. Never pay anyone for a job referral.",
    }
