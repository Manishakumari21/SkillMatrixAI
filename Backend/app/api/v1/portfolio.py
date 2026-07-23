import io
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from app.core.config import get_settings
from app.api.v1.auth import get_current_user
from app.models.user import User
from app.models.resume import Resume
from app.models.portfolio import Portfolio
from app.services.portfolio_service import generate_portfolio_content
from app.services.portfolio_pdf_service import build_portfolio_pdf
from app.core.logger import logger

settings = get_settings()
router = APIRouter(prefix="/portfolio", tags=["portfolio"])


class PortfolioInput(BaseModel):
    full_name: str
    title: str = "Software Engineer"
    email: str = ""
    phone: str = ""
    linkedin: str = ""
    github: str = ""
    website: str = ""
    about_me: str = ""
    education: str = ""
    projects: str = ""
    resume_id: str = ""


@router.post("/generate")
async def generate_portfolio(
    payload: PortfolioInput,
    current_user: User = Depends(get_current_user),
):
    resume_text = ""
    skills = []

    if payload.resume_id:
        try:
            resume = await Resume.get(payload.resume_id)
            if resume and resume.user_email == current_user.email:
                resume_text = resume.extracted_text or ""
                skills = resume.skills_found or []
        except Exception:
            pass

    if not resume_text:
        latest_resume = await Resume.find_one(
            {"user_email": current_user.email},
            sort=[("uploaded_at", -1)],
        )
        if latest_resume:
            resume_text = latest_resume.extracted_text or ""
            skills = latest_resume.skills_found or []

    data = {
        "full_name": payload.full_name,
        "title": payload.title,
        "email": payload.email,
        "phone": payload.phone,
        "linkedin": payload.linkedin,
        "github": payload.github,
        "website": payload.website,
        "about_me": payload.about_me,
        "education": payload.education,
        "projects": payload.projects,
        "resume_text": resume_text,
        "skills": skills,
    }

    sections = await generate_portfolio_content(data)

    sections["contact_email"] = payload.email
    sections["contact_phone"] = payload.phone
    sections["contact_linkedin"] = payload.linkedin
    sections["contact_github"] = payload.github
    sections["contact_website"] = payload.website

    portfolio = Portfolio(
        user_email=current_user.email,
        full_name=payload.full_name,
        title=payload.title,
        sections=sections,
    )
    await portfolio.insert()

    sections["portfolio_id"] = str(portfolio.id)
    sections["generated_at"] = portfolio.generated_at.isoformat()

    logger.info("Portfolio generated: user=%s name=%s", current_user.email, payload.full_name)
    return sections


@router.post("/preview")
async def preview_portfolio(
    payload: PortfolioInput,
    current_user: User = Depends(get_current_user),
):
    resume_text = ""
    skills = []

    if payload.resume_id:
        try:
            resume = await Resume.get(payload.resume_id)
            if resume and resume.user_email == current_user.email:
                resume_text = resume.extracted_text or ""
                skills = resume.skills_found or []
        except Exception:
            pass

    if not resume_text:
        latest_resume = await Resume.find_one(
            {"user_email": current_user.email},
            sort=[("uploaded_at", -1)],
        )
        if latest_resume:
            resume_text = latest_resume.extracted_text or ""
            skills = latest_resume.skills_found or []

    data = {
        "full_name": payload.full_name,
        "title": payload.title,
        "email": payload.email,
        "phone": payload.phone,
        "linkedin": payload.linkedin,
        "github": payload.github,
        "website": payload.website,
        "about_me": payload.about_me,
        "education": payload.education,
        "projects": payload.projects,
        "resume_text": resume_text,
        "skills": skills,
    }

    sections = await generate_portfolio_content(data)
    return sections


@router.post("/download/{portfolio_id}")
async def download_portfolio(
    portfolio_id: str,
    current_user: User = Depends(get_current_user),
):
    portfolio = await Portfolio.get(portfolio_id)
    if not portfolio:
        raise HTTPException(status_code=404, detail="Portfolio not found")
    if portfolio.user_email != current_user.email:
        raise HTTPException(status_code=403, detail="Access denied")

    personal = {
        "full_name": portfolio.full_name,
        "title": portfolio.title,
        "email": portfolio.sections.get("contact_email", ""),
        "phone": portfolio.sections.get("contact_phone", ""),
        "linkedin": portfolio.sections.get("contact_linkedin", ""),
        "github": portfolio.sections.get("contact_github", ""),
        "website": portfolio.sections.get("contact_website", ""),
    }

    pdf_bytes = build_portfolio_pdf(portfolio.sections, personal)
    filename = f"{portfolio.full_name.replace(' ', '_')}_Portfolio.pdf"

    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


@router.post("/download-live")
async def download_live_portfolio(
    payload: PortfolioInput,
    current_user: User = Depends(get_current_user),
):
    resume_text = ""
    skills = []

    if payload.resume_id:
        try:
            resume = await Resume.get(payload.resume_id)
            if resume and resume.user_email == current_user.email:
                resume_text = resume.extracted_text or ""
                skills = resume.skills_found or []
        except Exception:
            pass

    if not resume_text:
        latest_resume = await Resume.find_one(
            {"user_email": current_user.email},
            sort=[("uploaded_at", -1)],
        )
        if latest_resume:
            resume_text = latest_resume.extracted_text or ""
            skills = latest_resume.skills_found or []

    data = {
        "full_name": payload.full_name,
        "title": payload.title,
        "email": payload.email,
        "phone": payload.phone,
        "linkedin": payload.linkedin,
        "github": payload.github,
        "website": payload.website,
        "about_me": payload.about_me,
        "education": payload.education,
        "projects": payload.projects,
        "resume_text": resume_text,
        "skills": skills,
    }

    sections = await generate_portfolio_content(data)

    personal = {
        "full_name": payload.full_name,
        "title": payload.title,
        "email": payload.email,
        "phone": payload.phone,
        "linkedin": payload.linkedin,
        "github": payload.github,
        "website": payload.website,
    }

    pdf_bytes = build_portfolio_pdf(sections, personal)
    filename = f"{payload.full_name.replace(' ', '_')}_Portfolio.pdf"

    portfolio = Portfolio(
        user_email=current_user.email,
        full_name=payload.full_name,
        title=payload.title,
        sections=sections,
    )
    await portfolio.insert()

    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


@router.get("/list")
async def list_portfolios(current_user: User = Depends(get_current_user)):
    portfolios = await Portfolio.find(
        {"user_email": current_user.email},
        sort=[("generated_at", -1)],
    ).limit(settings.portfolio_max_portfolios).to_list()

    return [
        {
            "portfolio_id": str(p.id),
            "full_name": p.full_name,
            "title": p.title,
            "generated_at": p.generated_at.isoformat(),
        }
        for p in portfolios
    ]


@router.delete("/{portfolio_id}")
async def delete_portfolio(
    portfolio_id: str,
    current_user: User = Depends(get_current_user),
):
    portfolio = await Portfolio.get(portfolio_id)
    if not portfolio:
        raise HTTPException(status_code=404, detail="Portfolio not found")
    if portfolio.user_email != current_user.email:
        raise HTTPException(status_code=403, detail="Access denied")
    await portfolio.delete()
    return {"status": "deleted"}
