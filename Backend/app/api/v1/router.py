
from fastapi import APIRouter
from app.api.v1 import auth, resume, skill_gap, interview, roadmap, ats_resume, progress, learning_resources, roadmap_export, mock_interview, jobs, dsa, ats_score, admin, portfolio, apply

api_router = APIRouter(prefix="/api/v1")

api_router.include_router(auth.router)
api_router.include_router(resume.router)
api_router.include_router(skill_gap.router)
api_router.include_router(interview.router)
api_router.include_router(roadmap.router)
api_router.include_router(ats_resume.router)
api_router.include_router(progress.router)
api_router.include_router(learning_resources.router)
api_router.include_router(roadmap_export.router)
api_router.include_router(mock_interview.router)
api_router.include_router(jobs.router)
api_router.include_router(dsa.router)
api_router.include_router(ats_score.router)
api_router.include_router(admin.router)
api_router.include_router(portfolio.router)
api_router.include_router(apply.router)