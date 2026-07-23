from app.models.learning_resource import LearningResource

_cache: dict[str, dict] | None = None


async def _load_resources():
    global _cache
    if _cache is not None:
        return _cache
    resources = await LearningResource.find_all().to_list()
    _cache = {}
    for r in resources:
        _cache[r.skill.lower()] = {
            "docs_url": r.docs_url,
            "youtube_url": r.youtube_url,
            "course_url": r.course_url,
            "course_name": r.course_name,
            "course_provider": r.course_provider,
            "certificate": r.certificate,
        }
    return _cache


async def get_learning_resources(skills: list[str]) -> list[dict]:
    resources_map = await _load_resources()
    results = []
    for skill in skills:
        skill_lower = skill.lower()
        if skill_lower in resources_map:
            r = resources_map[skill_lower]
            results.append({
                "skill": skill,
                "docs_url": r["docs_url"],
                "youtube_url": r["youtube_url"],
                "course_url": r["course_url"],
                "course_name": r["course_name"],
                "course_provider": r["course_provider"],
                "certificate": r["certificate"],
            })
        else:
            search_query = skill.replace(" ", "+")
            results.append({
                "skill": skill,
                "docs_url": f"https://www.google.com/search?q={search_query}+documentation",
                "youtube_url": f"https://www.youtube.com/results?search_query={search_query}+tutorial+for+beginners",
                "course_url": f"https://www.coursera.org/search?query={search_query}",
                "course_name": f"Learn {skill}",
                "course_provider": "Coursera Search",
                "certificate": False,
            })
    return results


def invalidate_resource_cache():
    global _cache
    _cache = None
