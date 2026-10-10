# SkillMatrixAI — Backend

FastAPI + MongoDB (Beanie/Motor) API for SkillMatrixAI. See root `README.md` for full setup.

## Quick start

```bash
cd Backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # fill MONGO_URI, JWT_SECRET, GROQ_API_KEY
python seed_db.py
uvicorn app.main:app --reload
```

## Tests

```bash
# Pure unit tests (no DB needed)
pytest tests/test_ats_scoring.py tests/test_dsa_safety.py -v

# Full suite (needs MONGO_URI running)
pytest -v
```

DB-dependent tests skip automatically when MongoDB is unreachable (`tests/conftest.py`).
Interactive docs: http://localhost:8000/docs
