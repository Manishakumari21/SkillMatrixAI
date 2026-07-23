# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.


# SkillMatrixAI

A placement preparation platform that analyzes a resume, compares it against real job descriptions, points out skill gaps with an actual explanation behind each recommendation, and runs mock interviews grounded in a real question bank instead of AI guesswork.

## The problem

Most resume-to-job matching tools give you a confident sounding number and never explain where it came from. Ask them why a skill is "recommended" and there is no real answer, it is just an LLM's best guess dressed up as a score. Mock interview tools have a similar issue, the AI invents questions from memory, which means it can invent irrelevant or made up ones just as easily as good ones.

SkillMatrixAI is built around a different idea: every recommendation should be explainable, and every point where the system could fail should have a real, tested fallback instead of a crash.

## What makes this different from a typical resume analyzer

| Typical resume analyzer | SkillMatrixAI |
|---|---|
| LLM invents interview questions from memory | Retrieves real questions from a curated question bank first, only lets the LLM lightly reword them, and checks the answer did not drift into something invented |
| Match score is a vague number the LLM guessed | Match percentage is a real, countable fraction. Missing skills come with an explanation like "appears in 66.7% of the job postings you provided" |
| One matching method, usually shallow keyword search | Two methods available side by side, keyword matching and embeddings based semantic matching, so the improvement is visible, not just claimed |
| Scanned or bad pdf just breaks the upload | OCR fallback catches it automatically |
| No plan for what happens if the AI provider goes down or has no key configured | Explicit timeout, retry, and graceful fallback to real retrieved data, the app never just crashes |

## Core features

- **Resume upload and parsing** with OCR fallback for scanned resumes
- **Skill extraction**, both keyword based and embeddings based semantic matching
- **Skill gap analysis** against a single job description, with a quantified match percentage
- **Explainable roadmap** across multiple real job postings, showing exactly how in-demand each missing skill is, with a composite readiness score
- **RAG grounded mock interview questions**, retrieved from a real question bank and validated against hallucination, with an honest fallback to freeform generation when the bank has no relevant coverage
- **JWT based authentication**, every resume, comparison, and interview session belongs to a specific user

## Tech stack

**Backend:** FastAPI, MongoDB (via Beanie/Motor), JWT auth, PyMuPDF + Tesseract for OCR, sentence-transformers for embeddings, Groq for LLM calls

**Frontend:** React (Vite), React Router, plain CSS with a Catppuccin Mocha theme

## Project structure

```
SkillMatrixAI/
├── Backend/
│   ├── app/
│   │   ├── core/          # config, logging, security (JWT, password hashing)
│   │   ├── db/            # MongoDB connection and Beanie setup
│   │   ├── models/        # User, Resume documents
│   │   ├── api/v1/        # auth, resume, skill_gap, interview, roadmap routes
│   │   ├── services/      # pdf extraction, skill extraction, embeddings,
│   │   │                    gap analysis, retrieval, roadmap, llm service
│   │   └── data/          # skills_list.py, question_bank.csv
│   ├── tests/
│   └── requirements.txt
└── frontend/
    ├── src/
    │   ├── api/            # axios client with auth interceptor
    │   ├── context/         # auth context
    │   ├── components/      # Layout, ProtectedRoute
    │   └── pages/            # Login, Register, Dashboard, SkillGap,
    │                            Interview, Roadmap
    └── package.json
```

## Setup

### Backend

```bash
cd Backend
python -m venv venv
source venv/bin/activate

pip install -r requirements.txt

cp .env.example .env
# edit .env: set MONGO_URI (MongoDB Atlas connection string),
# JWT_SECRET (any long random string), and GROQ_API_KEY (optional,
# free tier at console.groq.com)

uvicorn app.main:app --reload
```

Runs at `http://localhost:8000`. Interactive API docs at `http://localhost:8000/docs`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Runs at `http://localhost:5173`. Requires the backend to be running at the same time.

### Tesseract (for OCR fallback)

```bash
sudo pacman -S tesseract tesseract-data-eng
# or the equivalent for your distro
```

## How the fallback design works

This was designed around a simple question: what happens when things do not go perfectly.

- **Resume has very few extractable skills** → flagged with a `low_confidence` field in the response, so the frontend can prompt the user for more detail instead of silently returning a poor result
- **LLM API call times out** → retried once automatically, and if it still fails, the app falls back to a real retrieved answer instead of an error page
- **AI generates a hallucinated interview question** → the generated question is embedded and compared back against the real retrieved questions. If it drifted too far from anything real, it is discarded and a real question from the bank is shown instead
- **No LLM API key configured at all** → every AI-dependent feature still works using real retrieved data, the app degrades gracefully rather than requiring a paid key to function
- **Every error is logged** with a structured entry (timestamp, endpoint, provider, error type) to `error.log`, so failures are traceable rather than silent

## Possible future additions

- NER based skill extraction to replace the current keyword list approach
- Skill ontology modelling prerequisite relationships between skills
- Voice based mock interviews with tone and pace analysis
- ATS style resume formatting score
- Queueing for concurrent user load during placement season
- Progress tracking dashboard showing readiness score improving over time

## Author

Built by Manisha as a final year project.