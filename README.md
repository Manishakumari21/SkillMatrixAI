# SkillMatrixAI

An AI-powered career development platform that helps users analyze resumes, identify skill gaps, practice interviews, generate career roadmaps, build ATS-optimized resumes, check ATS scores, browse real job listings, and practice DSA problems.

## Features

- **Resume Analysis** — Upload PDF resume, extract skills using regex + OCR fallback
- **Skill Gap Analysis** — Compare resume against job descriptions (exact + semantic matching)
- **Career Roadmap** — Multi-JD skill demand analysis with learning resources (docs, YouTube, courses)
- **Mock Interview** — AI-generated questions with anti-cheating, voice input, per-question feedback
- **Job Listings** — Real remote jobs from RemoteOK, Remotive, and Jobicy APIs with resume matching
- **DSA Practice** — 50 curated problems across 10 categories with hints and solutions
- **ATS Resume Builder** — LLM-optimized resume generation with PDF export
- **ATS Score Checker** — Rule-based scoring with circular gauge, keyword analysis, and suggestions
- **Portfolio Generator** — Auto-generate professional portfolio with PDF download
- **Progress Tracker** — Chart.js dashboards for skill growth, match trends, and demand analysis
- **Admin CRUD** — Manage skills, DSA problems, interview questions, learning resources

## Tech Stack

| Layer | Technology |
|-------|------------|
| Backend | Python 3.14, FastAPI, MongoDB (Beanie + Motor) |
| Frontend | React 19, Vite 8, React Router 7, Axios, Chart.js |
| AI/ML | Groq API (llama-3.1-8b-instant), sentence-transformers, FAISS |
| Auth | JWT (python-jose), bcrypt (passlib) |
| PDF | PyMuPDF (fitz), Tesseract OCR |
| Visualization | matplotlib, seaborn (server-side charts) |
| Theme | Rosé Pine dark theme |

## Prerequisites

- Python 3.10+
- Node.js 18+
- MongoDB instance (local or Atlas)
- Tesseract OCR (`sudo apt install tesseract-ocr` on Ubuntu)
- Groq API key (free at https://console.groq.com)

## Local Setup

### 1. Backend

```bash
cd Backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env — add your MONGO_URI, GROQ_API_KEY, and JWT_SECRET
python seed_db.py   # Seed initial data (skills, DSA problems, interview questions)
uvicorn app.main:app --reload
```

Backend runs at http://localhost:8000

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at http://localhost:5173

## Deployment

### Frontend (Vercel)

1. Push code to GitHub
2. Go to https://vercel.com → Import your GitHub repo
3. Set framework to **Vite**
4. Add environment variable: `VITE_API_URL` = your backend URL + `/api/v1`
   ```
   VITE_API_URL=https://your-backend.up.railway.app/api/v1
   ```
5. Deploy — Vercel auto-detects Vite and builds

### Backend (Railway)

1. Go to https://railway.app → New Project → Deploy from GitHub
2. Add these environment variables:

| Variable | Value |
|----------|-------|
| `MONGO_URI` | Your MongoDB Atlas connection string |
| `DB_NAME` | skillmatrix |
| `JWT_SECRET` | Any long random string |
| `GROQ_API_KEY` | Your Groq API key |
| `CORS_ORIGINS` | Your Vercel frontend URL |
| `ENVIRONMENT` | production |

3. Railway auto-detects Python and runs `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

### Database (MongoDB Atlas)

1. Go to https://cloud.mongodb.com → Create free cluster
2. Create a database user
3. Whitelist IP addresses (0.0.0.0/0 for Railway)
4. Copy the connection string to `MONGO_URI`
5. After deploying backend, seed the database:
   ```bash
   # Run locally with production MONGO_URI, or add seeding to backend startup
   python seed_db.py
   ```

## Project Structure

```
SkillMatrixAI/
├── Backend/
│   ├── app/
│   │   ├── api/v1/          # 14 route modules (auth, resume, skill_gap, interview, etc.)
│   │   ├── core/            # config.py (80+ settings), security, logger
│   │   ├── data/            # question_bank.csv, jobs_database.py, dsa_problems.json
│   │   ├── db/              # MongoDB connection (Beanie + Motor)
│   │   ├── models/          # 9 Beanie ODM models (User, Resume, Skill, etc.)
│   │   └── services/        # 15 service modules (AI, PDF, charts, etc.)
│   ├── seed_db.py           # Database seeding script
│   └── requirements.txt     # Python dependencies
├── frontend/
│   └── src/
│       ├── pages/           # 13 page components
│       │   └── mockinterview/ # SetupPhase, InterviewPhase, ResultsPhase
│       ├── components/
│       │   ├── shared/      # 11 reusable UI components
│       │   ├── dsa/         # DSA sub-components (CodeEditor, LanguageBar, etc.)
│       │   └── Layout.jsx   # Sidebar navigation
│       ├── context/         # AuthContext (JWT management)
│       └── api/             # Axios client (configurable API URL)
└── README.md
```

## API Endpoints

| Module | Prefix | Key Endpoints |
|--------|--------|---------------|
| Auth | /auth | POST /register, POST /login, GET /me |
| Resume | /resume | POST /upload |
| Skill Gap | /skill-gap | POST /compare, POST /compare-semantic |
| Mock Interview | /mock-interview | GET /config, POST /start, POST /evaluate |
| Roadmap | /roadmap | POST /generate |
| ATS Resume | /ats-resume | POST /generate, POST /preview |
| ATS Score | /ats-score | POST /check, POST /check-by-id |
| Progress | /progress | GET /, GET /skill-trend, POST /record-* |
| Jobs | /jobs | GET /, GET /{id}, GET /categories, POST /match |
| DSA | /dsa | GET /, GET /{id}, GET /categories, POST /run |
| Portfolio | /portfolio | POST /generate, POST /preview, GET /list, DELETE /delete/{id} |
| Admin | /admin | CRUD for skills, DSA problems, interview questions |

## Environment Variables

### Backend (.env)

| Variable | Required | Description |
|----------|----------|-------------|
| `MONGO_URI` | Yes | MongoDB connection string |
| `DB_NAME` | No | Database name (default: skillmatrix) |
| `JWT_SECRET` | Yes | Secret key for JWT tokens |
| `GROQ_API_KEY` | Yes | Groq API key for LLM features |
| `GEMINI_API_KEY` | No | Fallback LLM provider |
| `CORS_ORIGINS` | No | Comma-separated frontend URLs |

### Frontend (.env)

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_URL` | No | Backend API URL (default: http://localhost:8000/api/v1) |

