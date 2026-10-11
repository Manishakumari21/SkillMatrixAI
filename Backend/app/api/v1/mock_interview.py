import asyncio
import json
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from datetime import datetime, timezone

from app.core.config import get_settings
from app.api.v1.auth import get_current_user
from app.models.user import User
from app.models.user_progress import UserProgress
from app.services.llm_service import call_ai_api_safe
from app.services.user_keys import get_user_llm_keys
from app.core.logger import logger

settings = get_settings()
router = APIRouter(prefix="/mock-interview", tags=["mock-interview"])


class StartSessionRequest(BaseModel):
    role: str
    topic: str
    difficulty: str
    num_questions: int = settings.interview_default_questions


class AnswerSubmission(BaseModel):
    question: str
    typed_answer: str
    spoken_answer: str
    time_spent_seconds: int
    was_tab_switched: bool = False
    copy_paste_detected: bool = False
    speaking_pace_wpm: float = 0.0
    speech_duration_seconds: float = 0.0
    filler_words: list[str] = []


class EvaluateSessionRequest(BaseModel):
    role: str
    topic: str
    difficulty: str
    answers: list[AnswerSubmission]
    total_cheating_incidents: int = 0
    fullscreen_exits: int = 0


@router.get("/config")
async def get_interview_config():
    return {
        "roles": settings.interview_roles,
        "topics": settings.interview_topics,
        "difficulties": settings.interview_difficulties,
        "question_counts": settings.interview_question_counts,
        "default_questions": settings.interview_default_questions,
        "question_time_seconds": settings.interview_question_time_seconds,
        "speech_language": settings.interview_speech_language,
        "wpm_optimal_min": settings.wpm_optimal_min,
        "wpm_optimal_max": settings.wpm_optimal_max,
        "filler_words": settings.filler_words,
    }


@router.post("/start")
async def start_mock_session(
    payload: StartSessionRequest,
    current_user: User = Depends(get_current_user),
):
    prompt = f"""You are a senior technical interviewer conducting a serious mock interview.

Interview Configuration:
- Role: {payload.role}
- Topic: {payload.topic}
- Difficulty: {payload.difficulty}
- Number of questions: {payload.num_questions}

Generate exactly {payload.num_questions} interview questions. Each question must test a DIFFERENT sub-skill within the topic.

Rules:
- Questions must be specific, realistic, and progressively challenging.
- For easy: test fundamental understanding.
- For medium: test applied knowledge, problem-solving, or trade-offs.
- For hard: test deep expertise, system design thinking, or edge cases.
- Do NOT include answers.
- Return ONLY a JSON array of strings, nothing else. Example: ["Question 1", "Question 2"]

Return the JSON array directly, no markdown fences."""

    llm_response = await asyncio.to_thread(call_ai_api_safe, prompt, *get_user_llm_keys(current_user))

    if llm_response is None:
        fallback_questions = _get_fallback_questions(
            payload.role, payload.topic, payload.difficulty, payload.num_questions
        )
        return {
            "questions": fallback_questions,
            "source": "static_fallback",
            "session_id": f"session_{int(datetime.now(timezone.utc).timestamp())}",
        }

    try:
        cleaned = llm_response.strip()
        if cleaned.startswith("```"):
            lines = cleaned.split("\n")
            lines = [l for l in lines if not l.strip().startswith("```")]
            cleaned = "\n".join(lines)
        questions = json.loads(cleaned)
        if not isinstance(questions, list):
            questions = [cleaned]
    except (json.JSONDecodeError, KeyError):
        logger.warning("Failed to parse mock interview questions JSON")
        fallback_questions = _get_fallback_questions(
            payload.role, payload.topic, payload.difficulty, payload.num_questions
        )
        return {
            "questions": fallback_questions,
            "source": "static_fallback",
            "session_id": f"session_{int(datetime.now(timezone.utc).timestamp())}",
        }

    logger.info(
        "Mock interview session started: role=%s topic=%s difficulty=%s questions=%d",
        payload.role, payload.topic, payload.difficulty, len(questions),
    )

    return {
        "questions": questions[:payload.num_questions],
        "source": "llm_generated",
        "session_id": f"session_{int(datetime.now(timezone.utc).timestamp())}",
    }


@router.post("/evaluate")
async def evaluate_mock_session(
    payload: EvaluateSessionRequest,
    current_user: User = Depends(get_current_user),
):
    try:
        speech_metrics = _compute_speech_metrics(payload.answers)

        answered = [a for a in payload.answers if a.typed_answer.strip() or a.spoken_answer.strip()]
        skipped = [a for a in payload.answers if not a.typed_answer.strip() and not a.spoken_answer.strip()]

        answers_text = ""
        for i, ans in enumerate(answered, 1):
            integrity_flag = ""
            if ans.was_tab_switched:
                integrity_flag += " [TAB SWITCH DETECTED]"
            if ans.copy_paste_detected:
                integrity_flag += " [COPY-PASTE DETECTED]"
            similarity = 0.0
            if ans.spoken_answer and ans.typed_answer:
                similarity = _simple_similarity(ans.spoken_answer, ans.typed_answer)
                if similarity < settings.spoken_typed_mismatch_threshold:
                    integrity_flag += f" [SPOKEN-TYPED MISMATCH: {similarity:.0%} match]"

            filler_str = f"{len(ans.filler_words)} fillers ({', '.join(ans.filler_words[:5])})" if ans.filler_words else "0 fillers"
            pace_str = f"{ans.speaking_pace_wpm:.0f} WPM" if ans.speaking_pace_wpm > 0 else "N/A"

            answers_text += f"""
Question {i}: {ans.question}
Typed Answer: {ans.typed_answer or '(empty)'}
Spoken Answer: {ans.spoken_answer or '(not recorded)'}
Time Spent: {ans.time_spent_seconds}s | Speech Duration: {ans.speech_duration_seconds:.0f}s
Speaking Pace: {pace_str} | Filler Words: {filler_str}
Spoken-Typed Similarity: {similarity:.0%}
Flags: {integrity_flag or 'None'}
---
"""

        prompt = f"""You are a senior technical interviewer providing a comprehensive evaluation of a mock interview session, including speech quality analysis.

Interview Context:
- Role: {payload.role}
- Topic: {payload.topic}
- Difficulty: {payload.difficulty}
- Total Questions: {len(payload.answers)}
- Answered: {len(answered)} | Skipped: {len(skipped)}
- Cheating Incidents: {payload.total_cheating_incidents}
- Fullscreen Exits: {payload.fullscreen_exits}

Aggregate Speech Metrics:
- Average WPM: {speech_metrics['avg_wpm']:.0f} (optimal: {settings.wpm_optimal_min}-{settings.wpm_optimal_max})
- Total Filler Words: {speech_metrics['total_fillers']}
- Average Spoken-Typed Similarity: {speech_metrics['avg_similarity']:.0%}
- Questions with Speech: {speech_metrics['questions_with_speech']}/{speech_metrics['total_questions']}

Candidate Answers:
{answers_text}

Provide a THOROUGH evaluation. Return EXACTLY this JSON (no markdown fences, no extra text):
{{
  "overall_score": <integer 1-10>,
  "integrity_score": <integer 1-10 based on cheating incidents and answer consistency>,
  "verdict": "<PASS if score >= 6 and integrity >= 7, else FAIL>",
  "question_scores": [
    {{
      "question": "<the question text>",
      "score": <integer 1-10>,
      "feedback": "<1-2 sentence specific feedback on this answer>",
      "skills_demonstrated": ["<skill1>", "<skill2>"],
      "skills_missing": ["<skill1>", "<skill2>"],
      "structure_type": "<STAR|Technical|Unstructured|N/A>",
      "structure_feedback": "<1 sentence on answer structure quality>",
      "hint": "<2-3 sentence hint about what a strong answer should include, without giving away the full answer>"
    }}
  ],
  "skill_assessment": {{
    "strong_skills": ["<skill the candidate clearly knows well>"],
    "weak_skills": ["<skill the candidate is weak in>"],
    "critical_gaps": ["<skill completely missing that is essential for this role>"]
  }},
  "speech_analysis": {{
    "overall_speech_quality": "<Excellent|Good|Fair|Poor>",
    "pacing_feedback": "<1-2 sentences about speaking pace. Is it too fast, too slow, or optimal?>",
    "filler_feedback": "<1-2 sentences about filler word usage. How many, which ones are most frequent, how to reduce?>",
    "spoken_typed_comparison": "<1-2 sentences comparing spoken vs typed answers. Are they consistent? Which is stronger?>",
    "structure_assessment": "<1-2 sentences about answer structure. Does the candidate use STAR method or structured reasoning?>",
    "improvement_tips": ["<specific tip 1>", "<specific tip 2>", "<specific tip 3>"]
  }},
  "improvement_roadmap": [
    {{
      "priority": "<HIGH|MEDIUM|LOW>",
      "skill": "<skill name>",
      "what_to_learn": "<specific thing to study>",
      "recommended_resources": ["<resource1>", "<resource2>"],
      "estimated_time": "<time estimate>"
    }}
  ],
  "overall_feedback": "<2-3 sentence summary of performance>",
  "next_steps": ["<specific actionable step 1>", "<step 2>", "<step 3>"]
}}

Rules:
- Be brutally honest. This is a serious interview simulation.
- Score each question that was answered independently.
- Only evaluate questions that have actual answers. Skip any question with no typed or spoken answer.
- If cheating was detected (tab switches, copy-paste, spoken-typed mismatch), penalize integrity_score proportionally.
- For structure analysis: behavioral questions should use STAR (Situation, Task, Action, Result), technical questions should use structured reasoning (approach, implementation, trade-offs).
- Speech analysis should be specific — mention actual WPM numbers, actual filler words found, actual similarity percentages.
- The improvement_roadmap must be specific and actionable, not generic advice.
- Skills should be specific (e.g., "recursion", "system design trade-offs", not just "coding").
- If score is low, say so clearly. Do NOT sugarcoat."""

        llm_response = await asyncio.to_thread(call_ai_api_safe, prompt, *get_user_llm_keys(current_user))

        if llm_response is None:
            feedback = _fallback_evaluation(payload)
        else:
            try:
                cleaned = llm_response.strip()
                if cleaned.startswith("```"):
                    lines = cleaned.split("\n")
                    lines = [l for l in lines if not l.strip().startswith("```")]
                    cleaned = "\n".join(lines)
                feedback = json.loads(cleaned)
            except (json.JSONDecodeError, KeyError) as e:
                logger.warning("Failed to parse mock interview evaluation JSON: %s", e)
                feedback = _fallback_evaluation(payload)

        skipped_scores = [
            {
                "question": a.question,
                "score": 0,
                "feedback": "Question was skipped — no answer provided.",
                "skills_demonstrated": [],
                "skills_missing": [],
                "structure_type": "N/A",
                "structure_feedback": "No answer provided.",
                "hint": "Try to provide at least a brief answer covering the key concepts.",
            }
            for a in skipped
        ]
        feedback["question_scores"] = feedback.get("question_scores", []) + skipped_scores

        try:
            progress = await UserProgress.find_one({"user_email": current_user.email})
            if progress:
                progress.interview_questions_count += len(answered)
                progress.updated_at = datetime.now(timezone.utc)
                await progress.save()
        except Exception as e:
            logger.warning("Failed to update progress after mock interview: %s", e)

        feedback["source"] = "llm_evaluated" if llm_response else "static_fallback"
        feedback["cheating_incidents"] = payload.total_cheating_incidents
        feedback["fullscreen_exits"] = payload.fullscreen_exits
        feedback["speech_metrics"] = speech_metrics

        logger.info(
            "Mock interview evaluated: role=%s score=%s verdict=%s",
            payload.role,
            feedback.get("overall_score"),
            feedback.get("verdict"),
        )

        return feedback

    except Exception as e:
        logger.error("Unexpected error in mock interview evaluate: %s", e)
        return _fallback_evaluation(payload)


def _compute_speech_metrics(answers):
    wpm_values = [a.speaking_pace_wpm for a in answers if a.speaking_pace_wpm > 0]
    similarities = []
    total_fillers = 0
    questions_with_speech = 0

    for a in answers:
        total_fillers += len(a.filler_words)
        if a.spoken_answer and a.typed_answer:
            similarities.append(_simple_similarity(a.spoken_answer, a.typed_answer))
        if a.spoken_answer:
            questions_with_speech += 1

    avg_wpm = sum(wpm_values) / len(wpm_values) if wpm_values else 0
    avg_similarity = sum(similarities) / len(similarities) if similarities else 0

    pace_rating = "optimal"
    if avg_wpm > 0:
        if avg_wpm < settings.wpm_optimal_min:
            pace_rating = "too_slow"
        elif avg_wpm > settings.wpm_optimal_max:
            pace_rating = "too_fast"

    return {
        "avg_wpm": avg_wpm,
        "pace_rating": pace_rating,
        "total_fillers": total_fillers,
        "avg_filler_rate": total_fillers / max(questions_with_speech, 1),
        "avg_similarity": avg_similarity,
        "questions_with_speech": questions_with_speech,
        "total_questions": len(answers),
    }


def _simple_similarity(a: str, b: str) -> float:
    if not a or not b:
        return 0.0
    words_a = set(a.lower().split())
    words_b = set(b.lower().split())
    if not words_a or not words_b:
        return 0.0
    intersection = words_a & words_b
    union = words_a | words_b
    return len(intersection) / len(union) if union else 0.0


def _get_fallback_questions(role, topic, difficulty, count):
    easy = [
        f"What is {topic} and why is it important for a {role}?",
        f"Describe a basic use case of {topic} in a {role} role.",
        f"What are the fundamental concepts of {topic}?",
        f"How does {topic} relate to your work as a {role}?",
        f"What tools do you use that involve {topic}?",
    ]
    medium = [
        f"How do you approach {topic} problems in a {role} role?",
        f"Describe a challenging {topic} problem you solved recently.",
        f"What are the best practices for {topic} in {role} positions?",
        f"How do you stay updated with {topic} trends?",
        f"Explain a trade-off you made involving {topic}.",
    ]
    hard = [
        f"Design a system that heavily relies on {topic} for a {role} role.",
        f"How would you optimize a {topic}-based solution for scale?",
        f"What are the advanced edge cases in {topic} you have handled?",
        f"Describe a time you had to make a critical architectural decision involving {topic}.",
        f"How would you mentor a junior {role} on {topic} concepts?",
    ]
    if difficulty == "easy":
        pool = easy
    elif difficulty == "hard":
        pool = hard
    else:
        pool = medium
    return pool[:count]


def _fallback_evaluation(payload):
    n = len(payload.answers)
    avg_time = (
        sum(a.time_spent_seconds for a in payload.answers) // n if n else 0
    )
    empty_count = sum(
        1 for a in payload.answers
        if not a.typed_answer.strip() and not a.spoken_answer.strip()
    )

    if empty_count == n:
        score = 1
    elif empty_count > n // 2:
        score = 3
    elif avg_time < 30:
        score = 4
    else:
        score = 5

    speech_metrics = _compute_speech_metrics(payload.answers)

    return {
        "overall_score": score,
        "integrity_score": max(1, 10 - payload.total_cheating_incidents * 2),
        "verdict": "PASS" if score >= 6 and payload.total_cheating_incidents == 0 else "FAIL",
        "question_scores": [
            {
                "question": a.question,
                "score": 0 if (not a.typed_answer.strip() and not a.spoken_answer.strip()) else 5,
                "feedback": "Question was skipped — no answer provided." if (not a.typed_answer.strip() and not a.spoken_answer.strip()) else "Answer was not submitted or too short to evaluate properly.",
                "skills_demonstrated": [],
                "skills_missing": ["communication", "technical knowledge"],
                "structure_type": "N/A",
                "structure_feedback": "No answer provided." if (not a.typed_answer.strip() and not a.spoken_answer.strip()) else "Could not evaluate answer structure.",
                "hint": "Try to structure your answer with clear examples and specific details.",
            }
            for a in payload.answers
        ],
        "skill_assessment": {
            "strong_skills": [],
            "weak_skills": ["communication", "technical knowledge", "problem solving"],
            "critical_gaps": ["core technical skills", "structured thinking"],
        },
        "speech_analysis": {
            "overall_speech_quality": "Fair" if speech_metrics["questions_with_speech"] > 0 else "N/A",
            "pacing_feedback": f"Average speaking pace was {speech_metrics['avg_wpm']:.0f} WPM." if speech_metrics["avg_wpm"] > 0 else "No speech data recorded.",
            "filler_feedback": f"Detected {speech_metrics['total_fillers']} filler words across the session." if speech_metrics["total_fillers"] > 0 else "No filler words detected.",
            "spoken_typed_comparison": f"Average similarity between spoken and typed answers: {speech_metrics['avg_similarity']:.0%}." if speech_metrics["avg_similarity"] > 0 else "Could not compare spoken and typed answers.",
            "structure_assessment": "Could not evaluate answer structure without detailed analysis.",
            "improvement_tips": [
                "Practice structuring answers before speaking",
                "Record yourself and review for filler words",
                "Aim for 100-160 words per minute speaking pace",
            ],
        },
        "improvement_roadmap": [
            {
                "priority": "HIGH",
                "skill": "Interview Communication",
                "what_to_learn": "Practice structuring answers using STAR method",
                "recommended_resources": [
                    "Practice answering out loud daily",
                    "Record yourself and review",
                ],
                "estimated_time": "2-3 weeks of daily practice",
            }
        ],
        "overall_feedback": "Could not generate detailed AI feedback. Based on basic metrics, there is significant room for improvement.",
        "next_steps": [
            "Try answering all questions next time",
            "Practice speaking before typing",
            "Review the topic fundamentals",
        ],
        "speech_metrics": speech_metrics,
        "source": "static_fallback",
    }
