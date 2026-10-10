import asyncio
import time
import httpx
from typing import Optional
from app.core.config import get_settings
from app.core.logger import logger

settings = get_settings()

_cache = {"jobs": [], "fetched_at": 0}


async def fetch_remoteok(client: httpx.AsyncClient) -> list[dict]:
    try:
        resp = await client.get(settings.remoteok_url, timeout=settings.job_api_timeout)
        resp.raise_for_status()
        data = resp.json()
        jobs = []
        for item in data:
            if not isinstance(item, dict) or "id" not in item:
                continue
            tags = item.get("tags", []) or []
            jobs.append({
                "id": f"remoteok_{item['id']}",
                "title": item.get("position", "Unknown"),
                "company": item.get("company", "Unknown"),
                "location": item.get("location", "Remote"),
                "url": item.get("url", item.get("apply_url", "")),
                "salary": item.get("salary", ""),
                "tags": [t.lower() for t in tags],
                "description": (item.get("description", "") or "")[:settings.job_description_max_length],
                "posted_at": item.get("epoch", 0),
                "source": "RemoteOK",
            })
        logger.info("RemoteOK: fetched %d jobs", len(jobs))
        return jobs
    except Exception as e:
        logger.warning("RemoteOK fetch failed: %s", e)
        return []


async def fetch_remotive(client: httpx.AsyncClient) -> list[dict]:
    try:
        resp = await client.get(settings.remotive_url, timeout=settings.job_api_timeout)
        resp.raise_for_status()
        data = resp.json()
        jobs = []
        for item in data.get("jobs", []):
            tags = item.get("tags", []) or []
            category = item.get("category", "")
            if category:
                tags.append(category.lower())
            jobs.append({
                "id": f"remotive_{item.get('id', '')}",
                "title": item.get("title", "Unknown"),
                "company": item.get("company_name", "Unknown"),
                "location": item.get("candidate_required_location", "Remote"),
                "url": item.get("url", ""),
                "salary": item.get("salary", ""),
                "tags": [t.lower() for t in tags],
                "description": (item.get("description", "") or "")[:settings.job_description_max_length],
                "posted_at": item.get("publication_date", ""),
                "source": "Remotive",
            })
        logger.info("Remotive: fetched %d jobs", len(jobs))
        return jobs
    except Exception as e:
        logger.warning("Remotive fetch failed: %s", e)
        return []


async def fetch_jobicy(client: httpx.AsyncClient) -> list[dict]:
    try:
        resp = await client.get(settings.jobicy_url, timeout=settings.job_api_timeout)
        resp.raise_for_status()
        data = resp.json()
        jobs = []
        for item in data.get("jobs", []):
            tags = item.get("jobIndustry", []) or []
            jobs.append({
                "id": f"jobicy_{item.get('id', '')}",
                "title": item.get("jobTitle", "Unknown"),
                "company": item.get("companyName", "Unknown"),
                "location": item.get("jobGeo", "Remote"),
                "url": item.get("url", ""),
                "salary": item.get("annualSalaryMin", ""),
                "tags": [t.lower() for t in tags],
                "description": (item.get("jobDescription", "") or "")[:settings.job_description_max_length],
                "posted_at": item.get("pubDate", ""),
                "source": "Jobicy",
            })
        logger.info("Jobicy: fetched %d jobs", len(jobs))
        return jobs
    except Exception as e:
        logger.warning("Jobicy fetch failed: %s", e)
        return []


async def get_all_jobs(force_refresh: bool = False) -> list[dict]:
    now = time.time()
    if not force_refresh and _cache["jobs"] and (now - _cache["fetched_at"]) < settings.job_cache_ttl:
        return _cache["jobs"]

    async with httpx.AsyncClient() as client:
        results = await asyncio.gather(
            fetch_remoteok(client),
            fetch_remotive(client),
            fetch_jobicy(client),
            return_exceptions=True,
        )

    all_jobs = []
    for r in results:
        if isinstance(r, list):
            all_jobs.extend(r)

    if not all_jobs:
        from app.data.jobs_database import JOBS_DATABASE
        logger.warning("All job APIs failed, using mock database")
        all_jobs = [
            {
                "id": f"mock_{j['id']}",
                "title": j["title"],
                "company": j["company"],
                "location": j["location"],
                "url": j.get("apply_url", ""),
                "salary": j.get("salary_range", ""),
                "tags": [s.lower() for s in j.get("required_skills", [])],
                "description": j.get("description", "")[:settings.job_description_max_length],
                "posted_at": "",
                "source": "Mock",
            }
            for j in JOBS_DATABASE
        ]

    _cache["jobs"] = all_jobs
    _cache["fetched_at"] = now
    logger.info("Total jobs available: %d", len(all_jobs))
    return all_jobs


def _parse_timestamp(val) -> float:
    if isinstance(val, (int, float)) and val > 0:
        return float(val)
    if isinstance(val, str) and val:
        try:
            from datetime import datetime
            dt = datetime.fromisoformat(val.replace("Z", "+00:00"))
            return dt.timestamp()
        except (ValueError, AttributeError, TypeError) as exc:
            logger.debug("Unparseable job timestamp %r: %s", val, exc)
    return 0


async def search_jobs(
    query: str = "",
    tags: list[str] = None,
    location: str = "",
    page: int = 1,
    per_page: int = 20,
    max_age_days: int = 30,
) -> dict:
    """Search jobs, excluding postings older than max_age_days.

    max_age_days=30 default (nothing older than a month); pass 7 for
    "this week" view. Jobs with unparseable/missing dates (mock fallback)
    are excluded when a freshness filter is active. Pass max_age_days=0
    to disable filtering and show everything.
    """
    all_jobs = await get_all_jobs()

    filtered = all_jobs

    if max_age_days and max_age_days > 0:
        cutoff = time.time() - max_age_days * 86400
        fresh = []
        for j in filtered:
            ts = _parse_timestamp(j.get("posted_at", ""))
            if ts and ts >= cutoff:
                fresh.append(j)
        filtered = fresh

    if query:
        q = query.lower()
        filtered = [
            j for j in filtered
            if q in j["title"].lower()
            or q in j["company"].lower()
            or q in j.get("description", "").lower()
            or any(q in t for t in j.get("tags", []))
        ]

    if tags:
        tag_set = set(t.lower() for t in tags)
        filtered = [
            j for j in filtered
            if tag_set & set(j.get("tags", []))
        ]

    if location:
        loc = location.lower()
        filtered = [
            j for j in filtered
            if loc in j.get("location", "").lower()
        ]

    filtered.sort(key=lambda j: _parse_timestamp(j.get("posted_at", "")), reverse=True)

    total = len(filtered)
    start = (page - 1) * per_page
    end = start + per_page
    paginated = filtered[start:end]

    return {
        "jobs": paginated,
        "total": total,
        "page": page,
        "per_page": per_page,
        "total_pages": (total + per_page - 1) // per_page,
    }


async def get_categories() -> list[dict]:
    all_jobs = await get_all_jobs()
    tag_counts: dict[str, int] = {}
    for job in all_jobs:
        for tag in job.get("tags", []):
            tag_counts[tag] = tag_counts.get(tag, 0) + 1
    categories = [{"name": t, "count": c} for t, c in sorted(tag_counts.items(), key=lambda x: -x[1])]
    return categories
