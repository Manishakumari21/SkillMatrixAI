from app.models.skill import Skill

_cache: dict[str, str] | None = None


async def _build_lookup() -> dict[str, str]:
    global _cache
    if _cache is not None:
        return _cache
    skills = await Skill.find(Skill.is_active == True).to_list()
    lookup: dict[str, str] = {}
    for skill in skills:
        lookup[skill.name.lower()] = skill.name
        for alias in skill.aliases:
            lookup[alias.lower()] = skill.name
    _cache = lookup
    return _cache


def invalidate_cache():
    global _cache
    _cache = None


async def normalize_skill(raw: str) -> str:
    lookup = await _build_lookup()
    return lookup.get(raw.lower(), raw.lower())


async def normalize_skills(raw_list: list[str]) -> list[str]:
    lookup = await _build_lookup()
    return [lookup.get(s.lower(), s.lower()) for s in raw_list]


async def get_canonical_name(raw: str) -> str | None:
    lookup = await _build_lookup()
    return lookup.get(raw.lower())
