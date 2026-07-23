from app.core.config import get_settings
from app.services.skill_extraction_service import extract_skills
from app.services.learning_resources import get_learning_resources

settings = get_settings()


def _relevance_label(score):
    if score >= settings.relevance_high:
        return "high"
    elif score >= settings.relevance_moderate:
        return "moderate"
    else:
        return "low"


def _confidence_label(extracted_count, text_length):
    if extracted_count == 0:
        return "low"
    density = extracted_count / max(text_length / 100, 1)
    if density >= settings.confidence_density_high:
        return "high"
    elif density >= settings.confidence_density_moderate:
        return "moderate"
    else:
        return "low"


async def generate_roadmap(resume_skills, job_descriptions):
    resume_set = set(resume_skills)
    total_postings = len(job_descriptions)

    if total_postings == 0:
        return {
            "roadmap": [],
            "composite_readiness_score": 0,
            "postings_analyzed": 0,
            "analysis_confidence": "low",
            "relevance_score": 0,
            "relevance_label": "low",
        }

    skill_count = {}
    per_posting_match_percentages = []
    per_posting_relevance = []
    all_jd_skills = set()

    for posting_text in job_descriptions:
        posting_skills = await extract_skills(posting_text)
        posting_skill_set = set(posting_skills)
        all_jd_skills.update(posting_skill_set)

        for skill in posting_skill_set:
            skill_count[skill] = skill_count.get(skill, 0) + 1

        if len(posting_skill_set) > 0:
            matched = len(resume_set & posting_skill_set)
            percentage = (matched / len(posting_skill_set)) * 100
        else:
            percentage = 0
        per_posting_match_percentages.append(percentage)

        posting_relevance = round(
            (len(resume_set & posting_skill_set) / len(posting_skill_set) * 100)
            if len(posting_skill_set) > 0 else 0, 1
        )
        per_posting_relevance.append({
            "posting_index": len(per_posting_relevance) + 1,
            "skills_found": len(posting_skill_set),
            "skills_matched": len(resume_set & posting_skill_set),
            "relevance_percentage": posting_relevance,
        })

    total_jd_skills = len(all_jd_skills)
    if total_jd_skills > 0:
        overlap_skills = resume_set & all_jd_skills
        relevance_score = round((len(overlap_skills) / total_jd_skills) * 100, 1)
    else:
        relevance_score = 0

    relevance_label = _relevance_label(relevance_score / 100)

    total_extracted = sum(
        per_posting["skills_found"] for per_posting in per_posting_relevance
    )
    total_text_len = sum(len(t) for t in job_descriptions)
    confidence = _confidence_label(total_extracted, total_text_len / total_postings)

    roadmap = []
    for skill, count in skill_count.items():
        if skill in resume_set:
            continue

        demand_percentage = round((count / total_postings) * 100, 1)
        roadmap.append({
            "skill": skill,
            "demand_percentage": demand_percentage,
            "appears_in_postings": count,
            "explanation": f"This skill appears in {count} out of {total_postings} job postings ({demand_percentage}%) and is not present in your resume. Consider acquiring this skill to improve your job readiness."
        })

    roadmap.sort(key=lambda item: item["demand_percentage"], reverse=True)

    missing_skills = [item["skill"] for item in roadmap]
    resources_list = await get_learning_resources(missing_skills)
    resources = {r["skill"].lower(): r for r in resources_list}

    for item in roadmap:
        res = resources.get(item["skill"].lower(), {})
        item["learning_links"] = {
            "docs_url": res.get("docs_url", ""),
            "youtube_url": res.get("youtube_url", ""),
            "course_url": res.get("course_url", ""),
            "course_name": res.get("course_name", ""),
            "course_provider": res.get("course_provider", ""),
            "certificate": res.get("certificate", False),
        }

    composite_score = round(
        sum(per_posting_match_percentages) / total_postings, 1
    )

    return {
        "roadmap": roadmap,
        "composite_readiness_score": composite_score,
        "postings_analyzed": total_postings,
        "analysis_confidence": confidence,
        "relevance_score": relevance_score,
        "relevance_label": relevance_label,
        "per_posting_relevance": per_posting_relevance,
        "resume_skills_detected": len(resume_set),
        "jd_skills_detected": total_jd_skills,
        "overlap_skills": list(resume_set & all_jd_skills),
    }
