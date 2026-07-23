from fastapi import APIRouter, UploadFile, File, Depends, HTTPException

from app.api.v1.auth import get_current_user
from app.models.user import User
from app.models.resume import Resume
from app.models.user_progress import UserProgress
from app.services.pdf_service import extract_text_from_pdf
from app.services.skill_extraction_service import extract_skills
from app.core.config import get_settings
from app.core.logger import log_error, logger
from datetime import datetime, timezone

router =  APIRouter(prefix="/resume",tags=["resume"])
settings = get_settings()

@router.post("/upload")
async def upload_resume(
    file:UploadFile = File(...),
    current_user: User = Depends(get_current_user),

):
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are allowed.")

    file_bytes =  await file.read()

    try:
        text, method = extract_text_from_pdf(file_bytes)
    except Exception as e:
        log_error({
            "stage": "pdf_extraction_failed",
            "endpoint": "/resume/upload",
            "user_id": current_user.email,
            "error_type": type(e).__name__,
            "message": str(e),
        })
        raise HTTPException(
            status_code=400,
            detail="Could not read this pdf, please try uploading again",
        )  

    skills = await extract_skills(text)

    low_confidence = len(skills) < settings.min_skill_threshold

    resume =  Resume(
        user_email=current_user.email,
        original_filename=file.filename,
        extracted_text=text,
        skills_found=skills,
        extraction_method=method,

    )

    await resume.insert()
    logger.info("Resume uploaded and processed for user: %s", current_user.email,len(skills))

    progress = await UserProgress.find_one({"user_email": current_user.email})
    if progress is None:
        progress = UserProgress(user_email=current_user.email)
        await progress.insert()
    progress.resume_count += 1
    progress.last_resume_filename = file.filename
    progress.last_resume_skills = skills
    progress.updated_at = datetime.now(timezone.utc)
    await progress.save()


    return {
        "resume_id": str(resume.id),
        "extraction_method": method,
        "skills_found": skills,
        "skills_count": len(skills),
        "low_confidence": low_confidence,
    }
       