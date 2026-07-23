from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.api.v1.auth import get_current_user
from app.models.user import User
from app.models.skill import Skill
from app.models.dsa_problem import DSAProblem
from app.models.interview_question import InterviewQuestion
from app.models.learning_resource import LearningResource
from app.models.action_verb import ActionVerb
from app.services.skill_extraction_service import invalidate_cache
from app.services.ats_score_service import invalidate_verb_cache
from app.services.learning_resources import invalidate_resource_cache
from app.services.retrieval_service import invalidate_question_cache

router = APIRouter(prefix="/admin", tags=["admin"])


def _require_admin(user: User):
    if not getattr(user, "is_admin", False):
        raise HTTPException(status_code=403, detail="Admin access required")


# ── Skills ──────────────────────────────────────────────────

class SkillCreate(BaseModel):
    name: str
    category: str = ""
    aliases: list[str] = []

class SkillUpdate(BaseModel):
    category: str | None = None
    aliases: list[str] | None = None
    is_active: bool | None = None


@router.get("/skills")
async def list_skills(current_user: User = Depends(get_current_user)):
    skills = await Skill.find_all().sort(Skill.name).to_list()
    return {
        "skills": [
            {
                "id": str(s.id),
                "name": s.name,
                "category": s.category,
                "aliases": s.aliases,
                "is_active": s.is_active,
            }
            for s in skills
        ],
        "total": len(skills),
    }


@router.post("/skills")
async def create_skill(
    payload: SkillCreate,
    current_user: User = Depends(get_current_user),
):
    existing = await Skill.find_one(Skill.name == payload.name.lower())
    if existing:
        raise HTTPException(status_code=409, detail="Skill already exists")
    skill = Skill(name=payload.name.lower(), category=payload.category, aliases=payload.aliases)
    await skill.insert()
    invalidate_cache()
    return {"id": str(skill.id), "name": skill.name, "message": "Skill created"}


@router.put("/skills/{skill_id}")
async def update_skill(
    skill_id: str,
    payload: SkillUpdate,
    current_user: User = Depends(get_current_user),
):
    skill = await Skill.get(skill_id)
    if not skill:
        raise HTTPException(status_code=404, detail="Skill not found")
    if payload.category is not None:
        skill.category = payload.category
    if payload.aliases is not None:
        skill.aliases = payload.aliases
    if payload.is_active is not None:
        skill.is_active = payload.is_active
    skill.updated_at = datetime.now(timezone.utc)
    await skill.save()
    invalidate_cache()
    return {"message": "Skill updated"}


@router.delete("/skills/{skill_id}")
async def delete_skill(
    skill_id: str,
    current_user: User = Depends(get_current_user),
):
    skill = await Skill.get(skill_id)
    if not skill:
        raise HTTPException(status_code=404, detail="Skill not found")
    await skill.delete()
    invalidate_cache()
    return {"message": "Skill deleted"}


# ── DSA Problems ────────────────────────────────────────────

class DSAProblemCreate(BaseModel):
    title: str
    description: str
    category: str
    difficulty: str
    tags: list[str] = []
    examples: list[dict] = []
    hints: list[str] = []
    solution_approach: str = ""
    solutions: dict = {}

class DSAProblemUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    category: str | None = None
    difficulty: str | None = None
    tags: list[str] | None = None
    examples: list[dict] | None = None
    hints: list[str] | None = None
    solution_approach: str | None = None
    solutions: dict | None = None


@router.get("/dsa-problems")
async def list_dsa_problems(current_user: User = Depends(get_current_user)):
    problems = await DSAProblem.find_all().sort(DSAProblem.title).to_list()
    return {
        "problems": [
            {
                "id": str(p.id),
                "problem_id": p.problem_id,
                "title": p.title,
                "category": p.category,
                "difficulty": p.difficulty,
            }
            for p in problems
        ],
        "total": len(problems),
    }


@router.post("/dsa-problems")
async def create_dsa_problem(
    payload: DSAProblemCreate,
    current_user: User = Depends(get_current_user),
):
    import uuid
    problem_id = f"custom-{uuid.uuid4().hex[:8]}"
    problem = DSAProblem(
        problem_id=problem_id,
        title=payload.title,
        description=payload.description,
        category=payload.category,
        difficulty=payload.difficulty,
        tags=payload.tags,
        examples=payload.examples,
        hints=payload.hints,
        solution_approach=payload.solution_approach,
        solutions=payload.solutions,
    )
    await problem.insert()
    return {"id": str(problem.id), "problem_id": problem_id, "message": "Problem created"}


@router.put("/dsa-problems/{problem_id}")
async def update_dsa_problem(
    problem_id: str,
    payload: DSAProblemUpdate,
    current_user: User = Depends(get_current_user),
):
    problem = await DSAProblem.find_one(DSAProblem.problem_id == problem_id)
    if not problem:
        raise HTTPException(status_code=404, detail="Problem not found")
    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(problem, field, value)
    problem.updated_at = datetime.now(timezone.utc)
    await problem.save()
    return {"message": "Problem updated"}


@router.delete("/dsa-problems/{problem_id}")
async def delete_dsa_problem(
    problem_id: str,
    current_user: User = Depends(get_current_user),
):
    problem = await DSAProblem.find_one(DSAProblem.problem_id == problem_id)
    if not problem:
        raise HTTPException(status_code=404, detail="Problem not found")
    await problem.delete()
    return {"message": "Problem deleted"}


# ── Interview Questions ─────────────────────────────────────

class InterviewQuestionCreate(BaseModel):
    role: str
    topic: str
    difficulty: str
    question_text: str
    answer_hint: str = ""
    tags: list[str] = []

class InterviewQuestionUpdate(BaseModel):
    role: str | None = None
    topic: str | None = None
    difficulty: str | None = None
    question_text: str | None = None
    answer_hint: str | None = None
    tags: list[str] | None = None


@router.get("/interview-questions")
async def list_interview_questions(current_user: User = Depends(get_current_user)):
    questions = await InterviewQuestion.find_all().sort(InterviewQuestion.role).to_list()
    return {
        "questions": [
            {
                "id": str(q.id),
                "question_id": q.question_id,
                "role": q.role,
                "topic": q.topic,
                "difficulty": q.difficulty,
                "question_text": q.question_text,
            }
            for q in questions
        ],
        "total": len(questions),
    }


@router.post("/interview-questions")
async def create_interview_question(
    payload: InterviewQuestionCreate,
    current_user: User = Depends(get_current_user),
):
    import uuid
    qid = f"custom_{uuid.uuid4().hex[:8]}"
    question = InterviewQuestion(
        question_id=qid,
        role=payload.role,
        topic=payload.topic,
        difficulty=payload.difficulty,
        question_text=payload.question_text,
        answer_hint=payload.answer_hint,
        tags=payload.tags,
    )
    await question.insert()
    invalidate_question_cache()
    return {"id": str(question.id), "question_id": qid, "message": "Question created"}


@router.put("/interview-questions/{question_id}")
async def update_interview_question(
    question_id: str,
    payload: InterviewQuestionUpdate,
    current_user: User = Depends(get_current_user),
):
    question = await InterviewQuestion.find_one(InterviewQuestion.question_id == question_id)
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(question, field, value)
    await question.save()
    invalidate_question_cache()
    return {"message": "Question updated"}


@router.delete("/interview-questions/{question_id}")
async def delete_interview_question(
    question_id: str,
    current_user: User = Depends(get_current_user),
):
    question = await InterviewQuestion.find_one(InterviewQuestion.question_id == question_id)
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    await question.delete()
    invalidate_question_cache()
    return {"message": "Question deleted"}


# ── Learning Resources ──────────────────────────────────────

class LearningResourceCreate(BaseModel):
    skill: str
    docs_url: str = ""
    youtube_url: str = ""
    course_url: str = ""
    course_name: str = ""
    course_provider: str = ""
    certificate: bool = False

class LearningResourceUpdate(BaseModel):
    docs_url: str | None = None
    youtube_url: str | None = None
    course_url: str | None = None
    course_name: str | None = None
    course_provider: str | None = None
    certificate: bool | None = None


@router.get("/learning-resources")
async def list_learning_resources(current_user: User = Depends(get_current_user)):
    resources = await LearningResource.find_all().sort(LearningResource.skill).to_list()
    return {
        "resources": [
            {
                "id": str(r.id),
                "skill": r.skill,
                "course_name": r.course_name,
                "course_provider": r.course_provider,
                "certificate": r.certificate,
            }
            for r in resources
        ],
        "total": len(resources),
    }


@router.post("/learning-resources")
async def create_learning_resource(
    payload: LearningResourceCreate,
    current_user: User = Depends(get_current_user),
):
    existing = await LearningResource.find_one(LearningResource.skill == payload.skill.lower())
    if existing:
        raise HTTPException(status_code=409, detail="Resource for this skill already exists")
    resource = LearningResource(
        skill=payload.skill.lower(),
        docs_url=payload.docs_url,
        youtube_url=payload.youtube_url,
        course_url=payload.course_url,
        course_name=payload.course_name,
        course_provider=payload.course_provider,
        certificate=payload.certificate,
    )
    await resource.insert()
    invalidate_resource_cache()
    return {"id": str(resource.id), "message": "Resource created"}


@router.put("/learning-resources/{resource_id}")
async def update_learning_resource(
    resource_id: str,
    payload: LearningResourceUpdate,
    current_user: User = Depends(get_current_user),
):
    resource = await LearningResource.get(resource_id)
    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found")
    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(resource, field, value)
    resource.updated_at = datetime.now(timezone.utc)
    await resource.save()
    invalidate_resource_cache()
    return {"message": "Resource updated"}


@router.delete("/learning-resources/{resource_id}")
async def delete_learning_resource(
    resource_id: str,
    current_user: User = Depends(get_current_user),
):
    resource = await LearningResource.get(resource_id)
    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found")
    await resource.delete()
    invalidate_resource_cache()
    return {"message": "Resource deleted"}


# ── Action Verbs ────────────────────────────────────────────

class ActionVerbCreate(BaseModel):
    verb: str
    category: str = "general"
    intensity: str = "medium"

class ActionVerbUpdate(BaseModel):
    category: str | None = None
    intensity: str | None = None
    is_active: bool | None = None


@router.get("/action-verbs")
async def list_action_verbs(current_user: User = Depends(get_current_user)):
    verbs = await ActionVerb.find_all().sort(ActionVerb.verb).to_list()
    return {
        "verbs": [
            {
                "id": str(v.id),
                "verb": v.verb,
                "category": v.category,
                "intensity": v.intensity,
                "is_active": v.is_active,
            }
            for v in verbs
        ],
        "total": len(verbs),
    }


@router.post("/action-verbs")
async def create_action_verb(
    payload: ActionVerbCreate,
    current_user: User = Depends(get_current_user),
):
    existing = await ActionVerb.find_one(ActionVerb.verb == payload.verb.lower())
    if existing:
        raise HTTPException(status_code=409, detail="Verb already exists")
    verb = ActionVerb(verb=payload.verb.lower(), category=payload.category, intensity=payload.intensity)
    await verb.insert()
    invalidate_verb_cache()
    return {"id": str(verb.id), "message": "Verb created"}


@router.put("/action-verbs/{verb_id}")
async def update_action_verb(
    verb_id: str,
    payload: ActionVerbUpdate,
    current_user: User = Depends(get_current_user),
):
    verb = await ActionVerb.get(verb_id)
    if not verb:
        raise HTTPException(status_code=404, detail="Verb not found")
    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(verb, field, value)
    await verb.save()
    invalidate_verb_cache()
    return {"message": "Verb updated"}


@router.delete("/action-verbs/{verb_id}")
async def delete_action_verb(
    verb_id: str,
    current_user: User = Depends(get_current_user),
):
    verb = await ActionVerb.get(verb_id)
    if not verb:
        raise HTTPException(status_code=404, detail="Verb not found")
    await verb.delete()
    invalidate_verb_cache()
    return {"message": "Verb deleted"}


# ── Cache Invalidation ──────────────────────────────────────

@router.post("/cache/invalidate")
async def invalidate_all_caches(current_user: User = Depends(get_current_user)):
    invalidate_cache()
    invalidate_verb_cache()
    invalidate_resource_cache()
    invalidate_question_cache()
    return {"message": "All caches invalidated"}
