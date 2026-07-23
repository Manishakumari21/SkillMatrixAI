import io
import json
import fitz
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse

from app.core.config import get_settings
from app.api.v1.auth import get_current_user
from app.models.user import User
from app.services.llm_service import call_ai_api_safe
from app.core.logger import logger

settings = get_settings()
router = APIRouter(prefix="/ats-resume", tags=["ats-resume"])


class ResumeInput(BaseModel):
    full_name: str
    email: str
    phone: str = ""
    location: str = ""
    linkedin: str = ""
    website: str = ""
    summary: str = ""
    experience: list[dict] = []
    education: list[dict] = []
    skills: list[str] = []
    projects: list[dict] = []
    job_description: str = ""


@router.post("/generate")
async def generate_ats_resume(
    payload: ResumeInput,
    current_user: User = Depends(get_current_user),
):
    optimized = optimize_resume_content(payload)
    pdf_bytes = build_pdf(optimized)

    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={payload.full_name.replace(' ', '_')}_ATS_Resume.pdf"},
    )


@router.post("/preview")
async def preview_ats_resume(
    payload: ResumeInput,
    current_user: User = Depends(get_current_user),
):
    optimized = optimize_resume_content(payload)
    return optimized


def optimize_resume_content(data: ResumeInput) -> dict:
    if not data.job_description.strip():
        return _build_plain(data)

    prompt = f"""You are an ATS (Applicant Tracking System) resume optimizer.

Given this resume data and job description, optimize the resume content to be ATS-friendly.
Return ONLY a JSON object (no markdown, no fences) with this exact structure:
{{
  "full_name": "...",
  "email": "...",
  "phone": "...",
  "location": "...",
  "linkedin": "...",
  "website": "...",
  "summary": "<2-3 sentence professional summary tailored to the job, incorporating key terms from the job description naturally>",
  "experience": [
    {{
      "title": "Job Title",
      "company": "Company Name",
      "dates": "Jan 2023 - Present",
      "bullets": ["Action verb + accomplishment with quantified result", "..."]
    }}
  ],
  "education": [
    {{
      "degree": "B.S. in Computer Science",
      "school": "University Name",
      "dates": "2019 - 2023",
      "details": "GPA: 3.8, Relevant coursework: ..."
    }}
  ],
  "skills": ["skill1", "skill2", ...],
  "projects": [
    {{
      "name": "Project Name",
      "description": "Brief description with keywords from job description"
    }}
  ]
}}

Rules:
- Use action verbs (Built, Designed, Implemented, Optimized, Led, etc.)
- Quantify achievements where possible (improved performance by 40%, served 10k users)
- Incorporate keywords from the job description naturally into summary and bullets
- Keep bullet points concise (1-2 lines each)
- Skills should be ordered by relevance to the job description
- Do NOT fabricate experience, only rephrase existing content
- Do NOT add skills not present in the original resume

Resume data:
Name: {data.full_name}
Email: {data.email}
Phone: {data.phone}
Location: {data.location}
LinkedIn: {data.linkedin}
Website: {data.website}
Summary: {data.summary}
Experience: {json.dumps(data.experience, indent=2)}
Education: {json.dumps(data.education, indent=2)}
Skills: {json.dumps(data.skills)}
Projects: {json.dumps(data.projects, indent=2)}

Job Description:
{data.job_description}"""

    llm_response = call_ai_api_safe(prompt)

    if llm_response is not None:
        try:
            cleaned = llm_response.strip()
            if cleaned.startswith("```"):
                lines = cleaned.split("\n")
                lines = [l for l in lines if not l.strip().startswith("```")]
                cleaned = "\n".join(lines)
            optimized = json.loads(cleaned)
            optimized["_source"] = "llm_optimized"
            return optimized
        except (json.JSONDecodeError, KeyError) as e:
            logger.warning("Failed to parse LLM ATS output: %s", e)

    return _build_plain(data)


def _build_plain(data: ResumeInput) -> dict:
    return {
        "full_name": data.full_name,
        "email": data.email,
        "phone": data.phone,
        "location": data.location,
        "linkedin": data.linkedin,
        "website": data.website,
        "summary": data.summary or f"Professional with experience in {', '.join(data.skills[:5])}." if data.skills else data.summary,
        "experience": data.experience,
        "education": data.education,
        "skills": data.skills,
        "projects": data.projects,
        "_source": "passthrough",
    }


def build_pdf(data: dict) -> bytes:
    doc = fitz.open()
    page = doc.new_page(width=settings.pdf_page_width, height=settings.pdf_page_height)

    margin_left = settings.pdf_margin_left
    margin_right = settings.pdf_margin_right
    margin_top = settings.pdf_margin_top
    y = margin_top
    usable_width = settings.pdf_page_width - margin_left - margin_right

    font_regular = settings.pdf_font_name
    font_bold = settings.pdf_font_bold

    def draw_text(text, font, size, color=(0, 0, 0)):
        nonlocal y
        if not text:
            return
        page.insert_text(
            fitz.Point(margin_left, y),
            text,
            fontname=font,
            fontsize=size,
            color=color,
        )
        y += size + 4

    def draw_wrapped_text(text, font, size, color=(0, 0, 0), max_width=None):
        nonlocal y
        if not text:
            return
        nonlocal page
        w = max_width or usable_width
        lines = fitz.get_text("text", fontname=font, fontsize=size, text=text, width=w, sort=True)
        for line in lines.split("\n"):
            if line.strip():
                page.insert_text(fitz.Point(margin_left, y), line.strip(), fontname=font, fontsize=size, color=color)
                y += size + 3
        y += 2

    def draw_line():
        nonlocal y
        y += 4
        page.draw_line(fitz.Point(margin_left, y), fitz.Point(settings.pdf_page_width - margin_right, y), color=(0.7, 0.7, 0.7), width=0.5)
        y += 8

    def check_page_break(needed=80):
        nonlocal y
        if y > settings.pdf_page_height - needed:
            nonlocal page
            page = doc.new_page(width=settings.pdf_page_width, height=settings.pdf_page_height)
            y = margin_top

    name = data.get("full_name", "")
    draw_text(name, font_bold, settings.pdf_title_size, color=(0.1, 0.1, 0.1))
    y -= 2

    contact_parts = []
    if data.get("email"):
        contact_parts.append(data["email"])
    if data.get("phone"):
        contact_parts.append(data["phone"])
    if data.get("location"):
        contact_parts.append(data["location"])
    contact = " | ".join(contact_parts)
    draw_text(contact, font_regular, settings.pdf_small_size, color=(0.35, 0.35, 0.35))

    link_parts = []
    if data.get("linkedin"):
        link_parts.append(data["linkedin"])
    if data.get("website"):
        link_parts.append(data["website"])
    if link_parts:
        draw_text(" | ".join(link_parts), font_regular, settings.pdf_small_size, color=(0.35, 0.35, 0.35))

    draw_line()

    if data.get("summary"):
        draw_text("PROFESSIONAL SUMMARY", font_bold, settings.pdf_section_size, color=(0.15, 0.15, 0.15))
        y -= 1
        draw_wrapped_text(data["summary"], font_regular, settings.pdf_body_size, color=(0.25, 0.25, 0.25))
        draw_line()

    if data.get("experience"):
        check_page_break(100)
        draw_text("EXPERIENCE", font_bold, settings.pdf_section_size, color=(0.15, 0.15, 0.15))
        y -= 1
        for exp in data["experience"]:
            check_page_break(60)
            title_line = f"{exp.get('title', '')}  —  {exp.get('company', '')}"
            draw_text(title_line, font_bold, settings.pdf_heading_size, color=(0.1, 0.1, 0.1))
            if exp.get("dates"):
                draw_text(exp["dates"], font_regular, settings.pdf_small_size, color=(0.4, 0.4, 0.4))
                y -= 2
            for bullet in exp.get("bullets", []):
                check_page_break(30)
                draw_wrapped_text(f"• {bullet}", font_regular, settings.pdf_body_size, color=(0.25, 0.25, 0.25), max_width=usable_width - 10)
            y += 4
        draw_line()

    if data.get("projects"):
        check_page_break(80)
        draw_text("PROJECTS", font_bold, settings.pdf_section_size, color=(0.15, 0.15, 0.15))
        y -= 1
        for proj in data["projects"]:
            check_page_break(40)
            draw_text(proj.get("name", ""), font_bold, settings.pdf_heading_size, color=(0.1, 0.1, 0.1))
            y -= 1
            draw_wrapped_text(proj.get("description", ""), font_regular, settings.pdf_body_size, color=(0.25, 0.25, 0.25))
            y += 2
        draw_line()

    if data.get("education"):
        check_page_break(60)
        draw_text("EDUCATION", font_bold, settings.pdf_section_size, color=(0.15, 0.15, 0.15))
        y -= 1
        for edu in data["education"]:
            check_page_break(40)
            degree_line = f"{edu.get('degree', '')}  —  {edu.get('school', '')}"
            draw_text(degree_line, font_bold, settings.pdf_heading_size, color=(0.1, 0.1, 0.1))
            if edu.get("dates"):
                draw_text(edu["dates"], font_regular, settings.pdf_small_size, color=(0.4, 0.4, 0.4))
                y -= 2
            if edu.get("details"):
                draw_wrapped_text(edu["details"], font_regular, settings.pdf_body_size, color=(0.25, 0.25, 0.25))
            y += 4
        draw_line()

    if data.get("skills"):
        check_page_break(50)
        draw_text("SKILLS", font_bold, settings.pdf_section_size, color=(0.15, 0.15, 0.15))
        y -= 1
        skills_text = " | ".join(data["skills"])
        draw_wrapped_text(skills_text, font_regular, settings.pdf_body_size, color=(0.25, 0.25, 0.25))

    pdf_bytes = doc.tobytes()
    doc.close()
    return pdf_bytes
