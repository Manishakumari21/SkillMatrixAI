import io
from datetime import datetime, timezone

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from app.api.v1.auth import get_current_user
from app.models.user import User

router = APIRouter(prefix="/roadmap-export", tags=["roadmap-export"])


class RoadmapExportRequest(BaseModel):
    job_role: str
    missing_skills: list[str] = []
    match_percentage: float = 0.0
    recommendations: list[str] = []


@router.post("/pdf")
async def export_roadmap_pdf(
    payload: RoadmapExportRequest,
    current_user: User = Depends(get_current_user),
):
    try:
        import fitz
    except ImportError:
        return {"error": "PDF generation library not installed"}

    buf = io.BytesIO()
    doc = fitz.open()
    page = doc.new_page(width=595, height=842)

    y = 50
    title_color = fitz.pdfcolor["black"]
    accent_color = (0.22, 0.45, 0.72)

    def draw_text(text, fontsize=11, bold=False, color=None, indent=0):
        nonlocal y
        if y > 780:
            nonlocal doc, page
            doc.insert_page(doc.page_count, width=595, height=842)
            page = doc[-1]
            y = 50
        fontname = "helv" if not bold else "hebo"
        page.insert_text(
            fitz.Point(50 + indent, y),
            text,
            fontsize=fontsize,
            fontname=fontname,
            color=color or title_color,
        )
        y += fontsize + 8

    draw_text("SkillMatrixAI - Career Roadmap", fontsize=18, bold=True, color=accent_color)
    draw_text(f"Generated for: {current_user.full_name or current_user.email}", fontsize=10)
    draw_text(f"Date: {datetime.now(timezone.utc).strftime('%B %d, %Y')}", fontsize=10)
    y += 5

    draw_text(f"Target Role: {payload.job_role}", fontsize=13, bold=True)
    draw_text(f"Current Match: {payload.match_percentage:.0f}%", fontsize=11)
    y += 5

    draw_text("Skills to Develop", fontsize=13, bold=True, color=accent_color)
    y += 2
    if payload.missing_skills:
        for i, skill in enumerate(payload.missing_skills, 1):
            draw_text(f"{i}. {skill}", indent=10)
    else:
        draw_text("No gaps identified. You are well-aligned with this role!", indent=10)
    y += 5

    draw_text("Recommendations", fontsize=13, bold=True, color=accent_color)
    y += 2
    if payload.recommendations:
        for i, rec in enumerate(payload.recommendations, 1):
            wrapped = rec if len(rec) <= 70 else rec[:67] + "..."
            draw_text(f"{i}. {wrapped}", indent=10)
    else:
        draw_text("Keep building projects to strengthen your portfolio.", indent=10)

    doc.save(buf)
    doc.close()
    buf.seek(0)

    return StreamingResponse(
        buf,
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=skillmatrix_roadmap.pdf"},
    )
