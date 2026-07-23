import re
from app.core.config import get_settings
from app.models.action_verb import ActionVerb

settings = get_settings()

_verb_cache: list[str] | None = None
_stop_words = {
    "the", "and", "for", "with", "this", "that", "are", "was", "were", "been",
    "have", "has", "had", "will", "would", "could", "should", "may", "might",
    "shall", "can", "need", "must", "from", "into", "about", "between", "through",
    "during", "before", "after", "above", "below", "to", "of", "in", "on", "at",
    "by", "as", "or", "not", "but", "be", "is", "it", "an", "a", "we", "you",
    "your", "our", "their", "its", "my", "who", "which", "what", "when", "where",
    "how", "all", "each", "every", "both", "few", "more", "most", "other", "some",
    "such", "no", "nor", "too", "very", "also", "just", "than", "then", "so",
    "up", "out", "if", "only", "own", "same", "those", "these", "do", "does",
    "did", "doing", "able", "like", "well", "still", "even", "new", "want",
    "looking", "team", "work", "working", "role", "position", "job", "company",
    "apply", "join", "us", "ability", "plus", "etc", "per", "via",
}

SECTION_KEYWORDS = {
    "experience": ["experience", "work history", "employment", "professional experience", "work experience"],
    "education": ["education", "academic", "degree", "university", "college", "bachelor", "master", "phd"],
    "skills": ["skills", "technical skills", "technologies", "competencies", "proficiencies"],
    "summary": ["summary", "objective", "profile", "about", "professional summary"],
    "projects": ["projects", "portfolio", "personal projects", "side projects"],
}


async def get_action_verbs() -> list[str]:
    global _verb_cache
    if _verb_cache is not None:
        return _verb_cache
    verbs = await ActionVerb.find(ActionVerb.is_active == True).to_list()
    _verb_cache = [v.verb for v in verbs]
    return _verb_cache


def get_stop_words() -> set[str]:
    return _stop_words


def invalidate_verb_cache():
    global _verb_cache
    _verb_cache = None


async def score_ats(resume_text: str, job_description: str = "") -> dict:
    resume_lower = resume_text.lower()
    action_verbs = await get_action_verbs()

    keyword_score, keyword_matches, keyword_missing = _score_keywords(resume_text, job_description)
    format_score = _score_format(resume_text)
    action_score = _score_action_verbs(resume_text, action_verbs)
    quantified_score = _score_quantified_results(resume_text)
    length_score = _score_length(resume_text)

    overall = round(
        keyword_score * settings.ats_keyword_weight
        + format_score * settings.ats_format_weight
        + action_score * settings.ats_action_verb_weight
        + quantified_score * settings.ats_quantified_weight
        + length_score * settings.ats_length_weight
    )

    suggestions = _generate_suggestions(
        keyword_score, format_score, action_score, quantified_score, length_score,
        keyword_missing, resume_text
    )

    return {
        "overall_score": min(max(overall, 0), 100),
        "breakdown": {
            "keyword_match": {"score": round(keyword_score), "weight": "40%"},
            "format": {"score": round(format_score), "weight": "20%"},
            "action_verbs": {"score": round(action_score), "weight": "15%"},
            "quantified_results": {"score": round(quantified_score), "weight": "15%"},
            "length": {"score": round(length_score), "weight": "10%"},
        },
        "keyword_matches": keyword_matches,
        "keyword_missing": keyword_missing,
        "suggestions": suggestions,
    }


def _score_keywords(resume_text: str, job_description: str) -> tuple[float, list[str], list[str]]:
    if not job_description.strip():
        return settings.ats_default_score, [], []

    jd_lower = job_description.lower()
    words = re.findall(r'\b[a-zA-Z+#]{2,}\b', jd_lower)
    freq: dict[str, int] = {}
    for w in words:
        if w not in _stop_words and len(w) > 2:
            freq[w] = freq.get(w, 0) + 1

    top_keywords = sorted(freq.items(), key=lambda x: -x[1])[:settings.ats_top_keywords]
    keywords = [w for w, _ in top_keywords]

    matches = []
    missing = []
    resume_lower = resume_text.lower()
    resume_words = set(re.findall(r'\b[a-zA-Z+#]{2,}\b', resume_lower))

    for kw in keywords:
        if kw in resume_words or kw in resume_lower:
            matches.append(kw)
        else:
            missing.append(kw)

    if not keywords:
        return settings.ats_default_score, [], []

    score = (len(matches) / len(keywords)) * 100
    return min(score, 100), matches, missing[:10]


def _score_format(resume_text: str) -> float:
    score = 0
    text_lower = resume_text.lower()

    if re.search(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}', resume_text):
        score += 20

    if re.search(r'[\+]?[\d\-\(\)\s]{7,}', resume_text):
        score += 15

    sections_found = 0
    for section_name, keywords in SECTION_KEYWORDS.items():
        if any(kw in text_lower for kw in keywords):
            sections_found += 1

    score += min(sections_found * 12, 45)

    if len(resume_text.split()) >= 100:
        score += 10
    if len(resume_text.split()) >= 200:
        score += 10

    return min(score, 100)


def _score_action_verbs(resume_text: str, action_verbs: list[str]) -> float:
    sentences = re.split(r'[.!?\n]', resume_text)
    action_lines = 0
    total_lines = 0

    for line in sentences:
        line = line.strip()
        if not line or len(line) < 10:
            continue
        total_lines += 1
        first_word = line.split()[0].lower().rstrip(':;,')
        if first_word in action_verbs:
            action_lines += 1

    if total_lines == 0:
        return 40.0

    ratio = action_lines / total_lines
    return min(ratio * 150, 100)


def _score_quantified_results(resume_text: str) -> float:
    numbers = re.findall(r'\b\d+(?:\.\d+)?%?\b', resume_text)
    unique_numbers = set(numbers)

    if len(unique_numbers) >= settings.ats_quantified_tier1:
        return 100
    elif len(unique_numbers) >= settings.ats_quantified_tier2:
        return 80
    elif len(unique_numbers) >= settings.ats_quantified_tier3:
        return 60
    elif len(unique_numbers) >= settings.ats_quantified_tier4:
        return 40
    else:
        return 10


def _score_length(resume_text: str) -> float:
    word_count = len(resume_text.split())

    if settings.ats_word_count_optimal_min <= word_count <= settings.ats_word_count_optimal_max:
        return 100
    elif 100 <= word_count <= 800:
        return 75
    elif 50 <= word_count <= 1000:
        return 50
    else:
        return 25


def _generate_suggestions(
    keyword_score: float, format_score: float, action_score: float,
    quantified_score: float, length_score: float,
    keyword_missing: list[str], resume_text: str
) -> list[str]:
    suggestions = []

    if keyword_score < 60:
        if keyword_missing:
            suggestions.append(
                f"Add these missing keywords from the job description: {', '.join(keyword_missing[:5])}"
            )
        else:
            suggestions.append("Include more keywords from the job description in your resume")

    if format_score < 60:
        sections_found = []
        text_lower = resume_text.lower()
        for section_name, keywords in SECTION_KEYWORDS.items():
            if not any(kw in text_lower for kw in keywords):
                sections_found.append(section_name)
        if sections_found:
            suggestions.append(
                f"Add these missing sections: {', '.join(sections_found)}"
            )
        if not re.search(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}', resume_text):
            suggestions.append("Add a professional email address")
        if not re.search(r'[\+]?[\d\-\(\)\s]{7,}', resume_text):
            suggestions.append("Add a phone number")

    if action_score < 50:
        suggestions.append("Start bullet points with strong action verbs (Built, Led, Designed, Implemented, Optimized)")

    if quantified_score < 50:
        suggestions.append("Quantify your achievements with numbers and percentages (e.g., 'Improved performance by 40%')")

    if length_score < 50:
        word_count = len(resume_text.split())
        if word_count < 100:
            suggestions.append("Resume is too short. Add more details about your experience and skills (aim for 300-600 words)")
        elif word_count > 1000:
            suggestions.append("Resume is too long. Condense to 1-2 pages (aim for 300-600 words)")

    if not suggestions:
        suggestions.append("Your resume looks good! Consider tailoring it further for specific job descriptions.")

    return suggestions
