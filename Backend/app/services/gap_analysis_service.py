from app.core.config import get_settings
from app.services.embedding_service import get_embedding, cosine_similarity

settings = get_settings()


def _confidence_label(score):
    if score >= settings.confidence_exact:
        return "exact"
    elif score >= settings.confidence_high:
        return "high"
    elif score >= settings.similarity_threshold:
        return "moderate"
    else:
        return "low"


def _match_action(confidence):
    actions = {
        "exact": "You already have this skill. Highlight it in your resume.",
        "high": "Strong semantic overlap. Add this skill explicitly to your resume keywords.",
        "moderate": "Partial overlap. Consider upskilling to strengthen this area.",
        "low": "No match found. This is a critical gap to address.",
    }
    return actions.get(confidence, actions["low"])


def analyze_gap(resume_skills, job_skills):
    resume_set = set(resume_skills)
    job_set = set(job_skills)

    exact_matches = list(resume_set & job_set)
    remaining_job_skills = list(job_set - resume_set)

    resume_embedding = {}
    for skill in resume_skills:
        resume_embedding[skill] = get_embedding(skill)

    semantic_matches = []
    truly_missing = []

    for job_skill in remaining_job_skills:
        job_embedding = get_embedding(job_skill)

        best_match = None
        best_score = 0.0

        for resume_skill, res_emb in resume_embedding.items():
            score = cosine_similarity(job_embedding, res_emb)
            if score > best_score:
                best_score = score
                best_match = resume_skill

        if best_score >= settings.similarity_threshold:
            semantic_matches.append((job_skill, best_match, best_score))
        else:
            truly_missing.append(job_skill)

    total_job_skills = len(job_set)
    total_covered = len(exact_matches) + len(semantic_matches)

    if total_job_skills == 0:
        match_percentage = 0
    else:
        match_percentage = round((total_covered / total_job_skills) * 100, 2)

    return {
        "matched_skills": exact_matches,
        "missing_skills": truly_missing,
        "match_percentage": match_percentage
    }


def analyze_gap_semantic(resume_skills, job_skills):
    resume_set = set(resume_skills)
    job_set = set(job_skills)

    exact_matches = list(resume_set & job_set)
    remaining_job_skills = list(job_set - resume_set)

    resume_embedding = {}
    for skill in resume_skills:
        resume_embedding[skill] = get_embedding(skill)

    semantic_matches = []
    truly_missing = []

    for job_skill in remaining_job_skills:
        job_embedding = get_embedding(job_skill)

        best_match = None
        best_score = 0.0

        for resume_skill, res_emb in resume_embedding.items():
            score = cosine_similarity(job_embedding, res_emb)
            if score > best_score:
                best_score = score
                best_match = resume_skill

        if best_match and best_score >= settings.similarity_threshold:
            semantic_matches.append({
                "job_skill": job_skill,
                "closest_resume_skill": best_match,
                "similarity_score": round(float(best_score), 4)
            })
        else:
            truly_missing.append(job_skill)

    total_job_skills = len(job_set)
    total_covered = len(exact_matches) + len(semantic_matches)

    if total_job_skills == 0:
        match_percentage = 0
    else:
        match_percentage = round((total_covered / total_job_skills) * 100, 2)

    skill_details = []

    for skill in exact_matches:
        skill_details.append({
            "skill": skill,
            "status": "matched",
            "match_percentage": 100.0,
            "confidence": "exact",
            "action": _match_action("exact"),
        })

    for m in semantic_matches:
        pct = round(m["similarity_score"] * 100, 1)
        conf = _confidence_label(m["similarity_score"])
        skill_details.append({
            "skill": m["job_skill"],
            "status": "semantic",
            "match_percentage": pct,
            "confidence": conf,
            "matched_via": m["closest_resume_skill"],
            "action": _match_action(conf),
        })

    for skill in truly_missing:
        skill_details.append({
            "skill": skill,
            "status": "missing",
            "match_percentage": 0.0,
            "confidence": "none",
            "action": _match_action("low"),
        })

    skill_details.sort(key=lambda x: x["match_percentage"], reverse=True)

    coverage = {
        "exact_count": len(exact_matches),
        "semantic_count": len(semantic_matches),
        "missing_count": len(truly_missing),
        "total_job_skills": total_job_skills,
        "total_resume_skills": len(resume_skills),
        "coverage_ratio": round(total_covered / total_job_skills, 4) if total_job_skills > 0 else 0,
    }

    return {
        "matched_skills": exact_matches,
        "semantic_matches": semantic_matches,
        "missing_skills": truly_missing,
        "match_percentage": match_percentage,
        "skill_details": skill_details,
        "coverage": coverage,
    }
