import re
from app.models.skill import Skill

_cache: list[str] | None = None


async def get_all_skill_names() -> list[str]:
    global _cache
    if _cache is not None:
        return _cache
    skills = await Skill.find(Skill.is_active == True).to_list()
    _cache = [s.name for s in skills]
    return _cache


def invalidate_cache():
    global _cache
    _cache = None


async def extract_skills(text: str) -> list[str]:
    text_lower = text.lower()
    all_skills = await get_all_skill_names()
    found_skills = []

    for skill in all_skills:
        pattern = r'\b' + re.escape(skill) + r'\b'
        if re.search(pattern, text_lower):
            found_skills.append(skill)

    return found_skills
