from datetime import datetime, timezone
from fastapi import APIRouter, Depends
from pydantic import BaseModel

from app.api.v1.auth import get_current_user
from app.models.user import User
from app.models.user_progress import UserProgress
from app.services.llm_service import call_ai_api_safe
from app.services.retrieval_service import search_questions
from app.core.logger import logger

router = APIRouter(prefix="/interview", tags=["interview"])


class QuestionRequest(BaseModel):
    role: str
    topic: str
    difficulty: str


class EvaluateRequest(BaseModel):
    question: str
    answer: str
    role: str
    topic: str
    difficulty: str


@router.post("/question")
async def get_interview_question(
    payload: QuestionRequest,
    current_user: User = Depends(get_current_user),
):
    results = await search_questions(
        payload.role, payload.topic, payload.difficulty, top_k=1
    )

    if results:
        return {
            "question": results[0]["question_text"],
            "source": "question_bank",
            "similarity_score": results[0]["similarity_score"],
        }

    prompt = f"""You are a senior technical interviewer at a top tech company.
Generate ONE realistic interview question.

Requirements:
- Role: {payload.role}
- Topic: {payload.topic}
- Difficulty: {payload.difficulty}

Rules:
- The question must be specific, clear, and realistic.
- For easy: test basic understanding.
- For medium: test applied knowledge or problem-solving.
- For hard: test deep expertise, trade-offs, or system-level thinking.
- Do NOT include the answer.
- Return ONLY the question text, nothing else."""

    llm_answer = call_ai_api_safe(prompt)

    if llm_answer is None:
        return {
            "question": f"Tell me about your experience with {payload.topic} as a {payload.role}.",
            "source": "static_fallback",
        }

    logger.info(
        "LLM generated question for role=%s topic=%s difficulty=%s",
        payload.role, payload.topic, payload.difficulty,
    )
    return {
        "question": llm_answer.strip(),
        "source": "llm_generated",
    }


@router.post("/evaluate")
async def evaluate_answer(
    payload: EvaluateRequest,
    current_user: User = Depends(get_current_user),
):
    prompt = f"""You are a senior technical interviewer evaluating a candidate's answer.

Interview Context:
- Role: {payload.role}
- Topic: {payload.topic}
- Difficulty: {payload.difficulty}

Question asked:
{payload.question}

Candidate's answer:
{payload.answer}

Evaluate the answer and respond in EXACTLY this JSON format (no extra text, no markdown fences):
{{
  "score": <integer 1-10>,
  "strengths": "<one sentence about what was good>",
  "weaknesses": "<one sentence about what was missing or weak>",
  "suggested_improvement": "<one actionable tip to improve>",
  "ideal_answer_hint": "<brief description of what a strong answer would cover>"
}}

Rules:
- Be fair but honest. A score of 5 means average, 8+ means genuinely strong.
- Keep each field to one or two sentences max.
- If the answer is empty or completely unrelated, give score 1 and say so."""

    llm_response = call_ai_api_safe(prompt)

    if llm_response is None:
        answer_length = len(payload.answer.strip())
        if answer_length < 20:
            score = 2
            weakness = "Answer is too short to demonstrate understanding."
        elif answer_length < 100:
            score = 4
            weakness = "Answer shows some effort but lacks depth and specifics."
        else:
            score = 5
            weakness = "Answer is reasonable but could not be verified against an ideal response."

        return {
            "score": score,
            "strengths": "Attempted to address the question.",
            "weaknesses": weakness,
            "suggested_improvement": "Try to include specific examples, trade-offs, or concrete details.",
            "ideal_answer_hint": "A strong answer would cover key concepts, real-world examples, and trade-offs relevant to the topic.",
            "source": "static_fallback",
        }

    import json
    try:
        cleaned = llm_response.strip()
        if cleaned.startswith("```"):
            lines = cleaned.split("\n")
            lines = [l for l in lines if not l.strip().startswith("```")]
            cleaned = "\n".join(lines)
        feedback = json.loads(cleaned)
        feedback["source"] = "llm_evaluated"
    except (json.JSONDecodeError, KeyError) as e:
        logger.warning("Failed to parse LLM evaluation JSON: %s", e)
        feedback = {
            "score": 5,
            "strengths": "Answer was received and reviewed.",
            "weaknesses": "Could not parse structured feedback from the evaluator.",
            "suggested_improvement": "Try again or refine your answer.",
            "ideal_answer_hint": "A strong answer would cover key concepts with concrete examples.",
            "source": "parse_fallback",
            "raw_llm_response": llm_response.strip(),
        }

    progress = await UserProgress.find_one({"user_email": current_user.email})
    if progress:
        progress.interview_questions_count += 1
        progress.updated_at = datetime.now(timezone.utc)
        await progress.save()

    return feedback
