import json
import asyncio
from app.services.llm_service import call_ai_api_safe
from app.core.logger import logger


async def generate_portfolio_content(data: dict, groq_api_key: str | None = None, gemini_api_key: str | None = None) -> dict:
    resume_text = data.get("resume_text", "")
    skills = data.get("skills", [])

    prompt = f"""You are a professional portfolio content writer. Given this raw information about a person, generate polished, concise portfolio content.

Return ONLY a JSON object (no markdown fences) with this exact structure:
{{
  "about_me": "<2-3 sentence professional bio. Confident but not arrogant. Highlight key strengths and passion.>",
  "skills": {{
    "Frontend": ["React", "Vue"],
    "Backend": ["Python", "FastAPI"],
    "Tools": ["Docker", "Git"]
  }},
  "projects": [
    {{
      "name": "Project Name",
      "description": "1-2 sentence description. Action-oriented. What it does and what tech it uses.",
      "tech": ["React", "Node.js"]
    }}
  ],
  "education": [
    {{
      "degree": "B.S. Computer Science",
      "school": "University Name",
      "year": "2024",
      "details": "GPA, honors, relevant coursework"
    }}
  ]
}}

Rules:
- About me: 2-3 sentences, professional tone, mention top skills naturally
- Skills: Group logically by domain (Frontend, Backend, Data, DevOps, etc.). Use the skills provided.
- Projects: 2-4 projects max. Each description is 1-2 sentences. Include tech used.
- Education: Keep as provided if given, otherwise omit.
- Be specific and technical. No fluff.

Person info:
Name: {data.get('full_name', 'Professional')}
Title: {data.get('title', 'Software Engineer')}
Bio override: {data.get('about_me', '') or '(none provided)'}
Skills: {json.dumps(skills) if skills else '(none provided)'}
Projects override: {data.get('projects', '') or '(none provided)'}
Education: {data.get('education', '') or '(none provided)'}
Resume text (for context): {resume_text[:2000] if resume_text else '(none)'}"""

    llm_response = await asyncio.to_thread(call_ai_api_safe, prompt, groq_api_key, gemini_api_key)

    if llm_response is not None:
        try:
            cleaned = llm_response.strip()
            if cleaned.startswith("```"):
                lines = cleaned.split("\n")
                lines = [l for l in lines if not l.strip().startswith("```")]
                cleaned = "\n".join(lines)
            content = json.loads(cleaned)
            content["_source"] = "llm_optimized"
            return content
        except (json.JSONDecodeError, KeyError) as e:
            logger.warning("Failed to parse portfolio LLM output: %s", e)

    return _build_fallback(data)


def _build_fallback(data: dict) -> dict:
    skills = data.get("skills", [])
    skill_groups = {}
    if skills:
        frontend_kw = {"react", "vue", "angular", "html", "css", "javascript", "typescript", "next.js", "tailwind", "svelte"}
        backend_kw = {"python", "java", "go", "node.js", "fastapi", "django", "flask", "express", "ruby", "php"}
        data_kw = {"sql", "postgresql", "mongodb", "redis", "elasticsearch", "mysql", "pandas", "numpy"}
        devops_kw = {"docker", "kubernetes", "aws", "gcp", "azure", "ci/cd", "jenkins", "terraform", "git", "linux"}

        for s in skills:
            sl = s.lower()
            if any(k in sl for k in frontend_kw):
                skill_groups.setdefault("Frontend", []).append(s)
            elif any(k in sl for k in backend_kw):
                skill_groups.setdefault("Backend", []).append(s)
            elif any(k in sl for k in data_kw):
                skill_groups.setdefault("Data", []).append(s)
            elif any(k in sl for k in devops_kw):
                skill_groups.setdefault("DevOps", []).append(s)
            else:
                skill_groups.setdefault("Other", []).append(s)

    if not skill_groups and skills:
        skill_groups["Skills"] = skills

    return {
        "about_me": data.get("about_me") or f"Passionate {data.get('title', 'Software Engineer')} with expertise in {', '.join(skills[:5]) if skills else 'modern technologies'}.",
        "skills": skill_groups or {"Skills": ["Add your skills"]},
        "projects": [{"name": p, "description": "Project details", "tech": []} for p in (data.get("projects", "").split(",") if data.get("projects") else [])] or [{"name": "Your Projects", "description": "Add project details", "tech": []}],
        "education": [{"degree": data.get("education", ""), "school": "", "year": "", "details": ""}] if data.get("education") else [],
        "_source": "fallback",
    }
