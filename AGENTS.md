# AGENTS.md - SkillMatrixAI Project Memory

## Project Overview
AI-powered career development platform. Users upload resumes, compare against job descriptions, get skill gap analysis, practice interviews, generate career roadmaps, build ATS-optimized resumes, check ATS scores, browse real job listings, and practice DSA problems.

## Tech Stack
- **Backend**: Python 3.14, FastAPI, MongoDB (Beanie ODM + Motor async driver), uvicorn, pydantic-settings
- **Frontend**: React 19, Vite 8, React Router 7, Axios, Chart.js
- **AI/ML**: Groq API (llama-3.1-8b-instant), sentence-transformers (all-MiniLM-L6-v2), FAISS (faiss-cpu 1.14.3)
- **Auth**: JWT (python-jose), bcrypt (passlib)
- **PDF**: PyMuPDF (fitz), Tesseract OCR (pytesseract)
- **External APIs**: RemoteOK, Remotive, Jobicy (free job APIs, no auth)
- **Theme**: Rosé Pine dark theme (all CSS vars use `--rp-*` prefix, with `--ctp-*` backward compat aliases)

## How to Run
```bash
# Backend (from Backend/)
source venv/bin/activate
uvicorn app.main:app --reload

# Frontend (from frontend/)
npm run dev
```

## Key Files

### Backend - API Endpoints (`Backend/app/api/v1/`)
| File | Prefix | Key Endpoints |
|------|--------|---------------|
| auth.py | /auth | POST /register, POST /login, GET /me |
| resume.py | /resume | POST /upload |
| skill_gap.py | /skill-gap | POST /compare, POST /compare-semantic |
| interview.py | /interview | POST /question, POST /evaluate |
| mock_interview.py | /mock-interview | GET /config, POST /start, POST /evaluate (multi-question session with anti-cheating, speech analysis, structure scoring) |
| roadmap.py | /roadmap | POST /generate (auto-records demand history) |
| ats_resume.py | /ats-resume | POST /generate, POST /preview |
| progress.py | /progress | GET /, GET /skill-trend, POST /record-resume, POST /record-gap, POST /record-demand, POST /record-interview, POST /learn-skill, POST /unlearn-skill |
| learning_resources.py | /learning-resources | POST / |
| roadmap_export.py | /roadmap-export | POST /pdf |
| jobs.py | /jobs | GET / (list+filter), GET /{id}, GET /categories, POST /match |
| dsa.py | /dsa | GET / (list+filter), GET /{id}, GET /categories, POST /run (code execution + test case validation) |
| ats_score.py | /ats-score | POST /check, POST /check-by-id |
| portfolio.py | /portfolio | POST /generate, POST /preview, GET /download/{id}, POST /download-live, GET /list, DELETE /delete/{id} |
| admin.py | /admin | CRUD for skills, DSA problems, interview questions, learning resources, action verbs |

### Backend - Core (`Backend/app/core/`)
| File | Purpose |
|------|---------|
| config.py | Centralized configurable settings via pydantic-settings + `.env` file; includes interview roles/topics/difficulties/time/counts/speech language, portfolio settings, all other feature configs |
| logger.py | Structured JSON error logging to configurable file |

### Backend - Services (`Backend/app/services/`)
| File | Purpose |
|------|---------|
| skill_extraction_service.py | Regex-based skill extraction against MongoDB `skills` collection (cached) |
| gap_analysis_service.py | Exact + semantic gap analysis; thresholds (similarity, confidence) from config; returns `skill_details` with per-skill match %, confidence, actionable suggestions; returns `coverage` summary |
| embedding_service.py | sentence-transformers embeddings + cosine similarity; model name from config |
| retrieval_service.py | FAISS IndexFlatIP for semantic question retrieval from MongoDB; dimension from config |
| roadmap_services.py | Skill demand aggregation + learning links embedding; returns `analysis_confidence` (high/moderate/low based on extraction density), `relevance_score` (resume-JD overlap %), `relevance_label`, `per_posting_relevance` array, `overlap_skills` list, and `resume_skills_detected`/`jd_skills_detected` counts |
| learning_resources.py | Curated docs/YouTube/course links for 50+ skills |
| llm_service.py | Groq API calls with retry logic; model name + retry delay from config |
| pdf_service.py | PDF extraction with Tesseract OCR fallback; DPI + min text length from config |
| job_api_service.py | Fetches from RemoteOK/Remotive/Jobicy APIs, normalizes data, cache TTL + URLs from config, mock DB fallback; sorts by recency |
| ats_score_service.py | Rule-based ATS scoring with all weights from config; fetches action verbs from MongoDB (cached) |
| visualization_service.py | matplotlib chart generators with centralized `C` theme dict (Rosé Pine colors); chart limits + DPI from config; all return base64 PNG |
| skill_normalization_service.py | Alias→canonical lookup from MongoDB `skills.aliases` (cached); normalizes resume skills and job tags before matching |
| portfolio_service.py | LLM content generation for portfolio sections (about_me, skills, projects, education) with fallback |
| portfolio_pdf_service.py | PyMuPDF sidebar layout PDF builder (dark sidebar, initials circle, accent lines) |

### Backend - Data (`Backend/app/data/`)
| File | Purpose |
|------|---------|
| question_bank.csv | Interview question database (45+ questions) |
| jobs_database.py | 55 mock job postings (fallback when APIs fail) |
| dsa_problems.json | 50 curated DSA problems across 10 categories with descriptions, hints, solutions |

### Backend - Models (`Backend/app/models/`)
| File | Document | Key Fields |
|------|----------|------------|
| user.py | User | email, hashed_password, full_name |
| resume.py | Resume | user_email, extracted_text, skills_found, extraction_method |
| user_progress.py | UserProgress | resume_count, gap_analyses (capped 50), learned_skills, learned_skills_history (skill+timestamp), demand_history (skills+timestamp), interview_questions_count |
| skill.py | Skill | name (unique), category, aliases, is_active |
| dsa_problem.py | DSAProblem | problem_id (unique), title, description, category, difficulty, tags, examples, hints, solution_approach, solutions |
| interview_question.py | InterviewQuestion | question_id (unique), role, topic, difficulty, question_text, answer_hint, tags |
| learning_resource.py | LearningResource | skill (unique), docs_url, youtube_url, course_url, course_name, course_provider, certificate |
| action_verb.py | ActionVerb | verb (unique), category, intensity, is_active |

### Frontend Pages (`frontend/src/pages/`)
| File | Route | Purpose |
|------|-------|---------|
| Landing.jsx | / | Public marketing page |
| login.jsx | /login | Email/password login |
| register.jsx | /register | Account creation |
| dashboard.jsx | /dashboard | Resume upload, skill display, progress summary, inline ATS score |
| skillgap.jsx | /skill-gap | Job description comparison, learn/unlearn skills |
| MockInterview.jsx | /mock-interview | Multi-question mock session with anti-cheating, voice input |
| roadmap.jsx | /roadmap | Multi-JD skill demand analysis, learning links, PDF export |
| JobListings.jsx | /jobs | Real job listings from RemoteOK/Remotive/Jobicy, search, filter, match |
| DSAPractice.jsx | /dsa-practice | 50 DSA problems with code editor (Python/JS/C/C++/Go/Java/Rust/C#/TS/Kotlin/Swift/Ruby/Scala/PHP/Dart), test case execution, correctness %, card grid UI, category/difficulty filters |
| ats_resume.jsx | /ats-resume | ATS resume builder with LLM optimization |
| ProgressTracker.jsx | /progress-tracker | Chart.js charts: match trend, demand bars, skill growth doughnut; explains what each chart tracks |
| Portfolio.jsx | /portfolio | 3-tab UI: Create (form), Preview (live sidebar+main), My Portfolios (list with download/delete) |

### Frontend - Shared Components (`frontend/src/components/shared/`)
| File | Purpose |
|------|---------|
| ScoreRing.jsx | Reusable circular score display (replaces 3 local implementations) |
| ProgressBar.jsx | Reusable progress bar (replaces 3 local copies) |
| DifficultyBadge.jsx | Colored difficulty pill (easy/medium/hard) |
| PageHeader.jsx | Page title + subtitle + optional right element |
| SectionLabel.jsx | Uppercase section label |
| Pill.jsx | Generic colored pill |
| ChartImage.jsx | Base64 PNG chart display wrapper |
| GradientCard.jsx | Card with gradient top bar |
| StatCard.jsx | Stat card with label, value, color, icon |
| LoadingSpinner.jsx | LoadingButton + LoadingCard |
| EmptyState.jsx | Empty state with icon and message |

### Frontend - Auth
| File | Purpose |
|------|---------|
| components/AuthLayout.jsx | Shared login/register layout with orbs, logo, card |
| pages/login.jsx | Email/password login (uses AuthLayout) |
| pages/register.jsx | Account creation (uses AuthLayout) |

### Frontend - Mock Interview Phases (`frontend/src/pages/mockinterview/`)
| File | Purpose |
|------|---------|
| SetupPhase.jsx | Config screen: role, topic, difficulty, question count |
| InterviewPhase.jsx | Active interview: timer, questions, recording, speech indicators |
| ResultsPhase.jsx | Results display: verdict, skills, breakdown, speech analysis |

### Frontend - DSA Components (`frontend/src/components/dsa/`)
| File | Purpose |
|------|---------|
| LanguageBar.jsx | Horizontal scrollable language selector with arrows |
| CodeEditor.jsx | Line numbers + textarea with tab/enter handling |
| RunResults.jsx | Test case results display with score, progress, approach |
| ProblemDescription.jsx | Left pane with problem details, examples, hints, tags |
| constants.js | LANG_SAMPLES, LANG_LABELS, LANG_ICONS, LANG_LIST |

### Frontend - Infrastructure
| File | Purpose |
|------|---------|
| App.jsx | Route definitions, ProtectedRoute wrapper (11 routes) |
| components/Layout.jsx | Sidebar nav (9 items), logo, sign-out |
| context/AuthContext.jsx | JWT token management in localStorage |
| api/client.js | Axios instance, base URL localhost:8000/api/v1, auto-attach token |
| index.css | Rosé Pine theme vars, all component styles including job cards, DSA list, ATS gauge, shared component styles, auth layout styles |

## Data Flow
1. Upload resume -> extract text (PyMuPDF + OCR fallback) -> regex skill extraction -> store in MongoDB
2. Skill gap: extract skills from JD -> compare against resume skills (exact + semantic) -> record to progress
3. Roadmap: extract skills from multiple JDs -> count demand % -> rank missing skills -> embed learning links -> record demand to progress
4. Interview: retrieve similar questions via FAISS -> send to Groq LLM -> evaluate answer via LLM
5. ATS Resume: collect form data -> LLM optimizes content -> PyMuPDF generates PDF
6. Job Listings: fetch from RemoteOK/Remotive/Jobicy APIs -> normalize -> search/filter -> match against resume skills
7. DSA Practice: curated 50 problems -> filter by category/difficulty -> expand to show description, hints, solution
8. ATS Score: rule-based scoring (keywords, format, action verbs, quantified results, length) -> circular gauge + suggestions

## Important Notes
- Roadmap demand is automatically recorded to UserProgress.demand_history on each generation
- Gap analyses are capped at 50 entries (oldest trimmed)
- FAISS index is built once on first interview request, then cached in memory
- Learning resources are hardcoded for 50+ skills with free courses, Google search fallback for unknowns
- `question_bank.csv` is the interview question database (45+ questions)
- Job API service caches results for 15 min; falls back to 55-job mock DB if all APIs fail
- DSA problems are loaded from JSON on first request, then cached in memory
- ATS scoring is 100% rule-based (no LLM), deterministic and fast
- Skill gap `skill_details` provides per-skill match percentages and confidence (exact/high/moderate/none) with actionable suggestions
- Skill gap uses PolarArea chart (react-chartjs-2) for coverage visualization
- Roadmap `analysis_confidence` is based on skill extraction density from JD text
- Roadmap `relevance_score` measures resume-JD skill overlap; `relevance_label` warns low relevance
- Roadmap shows per-posting relevance bars for each individual JD analyzed
- All visualization charts (ATS score, skill gap, roadmap) are generated server-side via matplotlib/seaborn as base64 PNG
- Charts use Rosé Pine color palette with `#1e1e2e` dark background
- DSA code editor supports 16 languages: Python 3, JavaScript, Java, C, C++, C#, Go, Rust, TypeScript, Kotlin, Swift, Ruby, Scala, PHP, Dart
- DSA `/run` endpoint uses unified `_exec_test()` function handling all languages with subprocess
- Sidebar nav order: Dashboard > Skill Gap > Roadmap > Jobs > Mock Interview > DSA Practice > ATS Resume > ATS Score > Portfolio > Progress

## Recent Changes (This Session)
1. Embedded learning links (Docs, YouTube, Course) directly in roadmap API response
2. Fixed ATS resume page scrolling issue (mesh-bg CSS was position:fixed on container)
3. Replaced manual cosine similarity loop with FAISS IndexFlatIP in retrieval_service.py
4. Expanded UserProgress model: added learned_skills_history, demand_history
5. New GET /progress/skill-trend endpoint for chart data
6. New POST /progress/record-demand endpoint
7. skill_gap.py now stores matched_skills in gap_analyses entries
8. gap_analyses cap raised from 20 to 50
9. Installed chart.js + react-chartjs-2, created ProgressTracker.jsx with Line/Bar/Doughnut charts
10. Added Progress nav item to sidebar, /progress-tracker route
11. Dashboard now links to Progress Tracker page
12. Mock interview: removed TTS auto-read/speak-aloud, added separate Submit Answer + Next Question buttons
13. Mock interview: voice button always enabled, key prop for re-render, fixed stale answers bug
14. ATS resume: removed Website/Portfolio field, removed Projects section
15. Interview page: removed all voice/TTS/STT, redesigned with professional layout
16. Landing page: changed accent palette to indigo/blue, updated floating orbs, navbar
17. Removed Interview page (interview.jsx) - kept only Mock Interview
18. Overhauled roadmap learning resources: 50+ skills with free courses
19. Added course_name, course_provider, certificate fields to SKILL_RESOURCES
20. Roadmap UI shows course cards with provider and "Free Certificate" badge
21. Switched frontend theme from Catppuccin Mocha to Rosé Pine
22. Reordered sidebar nav for logical flow
23. NEW: Job Listings feature - backend service fetching from RemoteOK/Remotive/Jobicy, /jobs endpoint with search/filter/match, frontend JobListings.jsx page with real-time job cards and apply links
24. NEW: DSA Practice Hub - 50 curated problems across 10 categories (Arrays, Strings, Linked Lists, Trees, Graphs, DP, Sorting/Searching, Stack/Queue, HashMap, Greedy) with descriptions, examples, hints, and Python/JS solutions
25. NEW: ATS Score Checker - rule-based scoring engine (keyword match, format, action verbs, quantified results, length) with circular SVG gauge UI, breakdown cards, keyword analysis, and actionable suggestions
26. Backend router updated: jobs.py, dsa.py, ats_score.py all registered
27. Sidebar nav expanded to 11 items: Dashboard, Skill Gap, Roadmap, Jobs, Mock Interview, DSA Practice, ATS Resume, ATS Score, Portfolio, Progress
28. App.jsx routes expanded to 14 protected routes
29. Skill gap enhanced: `skill_details` array with per-skill match %, confidence levels (exact/high/moderate/none), actionable suggestions, and `coverage` summary (exact/semantic/missing counts, coverage ratio)
30. Skill gap frontend: PolarArea chart (react-chartjs-2) showing skill coverage breakdown, per-skill progress bars with confidence badges, enhanced missing skills with action prompts
31. Roadmap enhanced: `analysis_confidence` (high/moderate/low based on extraction density), `relevance_score` (resume-JD overlap %), `relevance_label`, `per_posting_relevance` array with per-JD skill counts and match rates, `overlap_skills` list
32. Roadmap frontend: 4-column stat grid with confidence and relevance cards, low-relevance warning banner for mismatched resume/JD backgrounds, per-posting relevance bars showing skill match per JD
33. DSA Practice: added POST /dsa/run endpoint for code execution against test cases (Python via subprocess, JavaScript via node)
34. DSA Practice: code editor with language selector (Python/JS), tab support, run & check against test cases with correctness %
35. DSA Practice: redesigned from one-line list to card grid layout with hover effects, instant search with category keyword matching
36. DSA Practice: shows test case results (pass/fail per case), solution approach after failed attempts, View Solution toggle
37. DSA search: also searches category names (not just title/description/tags), instant reload on clear
38. Job Listings: sorted by recency (most recent first), NEW badge for jobs posted within 3 days, improved freshness display (m/h/d/mo ago)
39. NEW: Python visualization service (`visualization_service.py`) using matplotlib/seaborn — generates ATS radar chart, ATS gauge, skill gap bar chart, skill match per-skill bars, radar chart, roadmap demand chart, relevance pie chart; all returned as base64 PNG
40. All visualization charts use Rosé Pine color palette and dark theme (`#1e1e2e` bg)
41. ATS score endpoint (`/ats-score/check` and `/check-by-id`) now returns `charts.radar` and `charts.gauge` as base64 images
42. Skill gap endpoints now return `charts.coverage`, `charts.radar`, and `charts.skill_bars` as base64 images
43. Roadmap endpoint now returns `charts.demand` and `charts.relevance` as base64 images
44. Dashboard displays Python-generated gauge image (falls back to MiniScoreCircle SVG if unavailable) and radar chart
45. Skill gap frontend displays Python-generated coverage, radar, and skill bars charts above the interactive PolarArea
46. Roadmap frontend displays Python-generated demand bar chart and relevance pie chart
47. DSA code editor expanded to 16 languages like LeetCode: Python 3, JavaScript, Java, C, C++, C#, Go, Rust, TypeScript, Kotlin, Swift, Ruby, Scala, PHP, Dart
48. Backend DSA `/run` endpoint unified into single `_exec_test()` with generic `_wrap_code()` for all languages; compiler check returns graceful error if runtime not installed
49. Backend `/dsa/languages` endpoint returns list of all 16 supported languages with labels
50. DSA language selector shows all languages as pill buttons with flex-wrap
51. DSA code editor redesigned: LeetCode-style horizontal scrollable language bar with arrow navigation, line numbers, auto-indent on Enter, localStorage language persistence, draggable split pane between problem and editor
52. DSA language list trimmed to 8 career-relevant languages: Python 3, JavaScript, Java, C++, C, Go, TypeScript, Rust (removed C#, Kotlin, Swift, Ruby, Scala, PHP, Dart)
53. NEW: MongoDB-backed data layer — 5 new Beanie Document models: Skill, DSAProblem, InterviewQuestion, LearningResource, ActionVerb
54. Seed script (`seed_db.py`) populates all 5 collections from existing hardcoded data (96 skills, 50 DSA problems, 45 interview questions, 65+ learning resources, 130+ action verbs)
55. `skill_extraction_service.py` now async — fetches skill list from MongoDB `skills` collection (cached in memory)
56. `learning_resources.py` service now async — fetches from MongoDB `learning_resources` collection (cached)
57. `retrieval_service.py` now async — loads interview questions from MongoDB `interview_questions` collection for FAISS indexing
58. `ats_score_service.py` now async — fetches action verbs from MongoDB `action_verbs` collection (cached)
59. All API endpoints updated to await async services: resume.py, skill_gap.py, roadmap.py, interview.py, dsa.py, ats_score.py, learning_resources.py, job_recommendations.py
60. NEW: Admin CRUD API (`/api/v1/admin/`) — full management for skills, DSA problems, interview questions, learning resources, and action verbs with cache invalidation
61. Fixed seed_db.py paths — DSA problems and question bank CSV now resolve correctly from Backend/app/data/
62. Deleted dead code: `skill_gap_chart.py` (old Catppuccin theme duplicate) and `skills_list.py` (replaced by MongoDB)
63. Removed unused `import csv` from `retrieval_service.py`, fixed hardcoded FAISS dimension `384` → uses `settings.embedding_dimension`
64. `job_recommendations.py` rewritten to use `job_api_service.get_all_jobs()` instead of hardcoded `JOBS_DATABASE`
65. `llm_service.py` now uses `settings.llm_model_name` and adds `settings.llm_retry_wait_seconds` delay between retries
66. `embedding_service.py` now uses `settings.embedding_model_name` instead of hardcoded model string
67. `main.py` CORS origins now configurable via `settings.cors_origins` (was `["*"]`)
68. `logger.py` error log path now configurable via `settings.error_log_path`
69. NEW: Centralized `config.py` with 80+ configurable settings across 15 categories (App, Database, Auth, LLM, Embeddings, Skill Extraction, Gap Analysis, Roadmap, History Caps, ATS Scoring, Job APIs, Job Matching, Mock Interview, DSA Execution, PDF/OCR, Visualization, Colors)
70. History cap `50` consolidated from 5 duplicated magic numbers across progress.py, skill_gap.py, roadmap.py into `settings.gap_analyses_cap` and `settings.demand_history_cap`
71. `gap_analysis_service.py` thresholds (similarity 0.55, confidence 0.90/0.75) now from config
72. `roadmap_services.py` thresholds (relevance 0.70/0.40, density 0.3/0.1) now from config
73. `ats_score_service.py` all scoring weights (40/20/15/15/10) and thresholds now from config
74. `visualization_service.py` refactored: single `C` theme dict with all Rosé Pine colors, `_score_color()` helper, chart limits from config
75. `job_api_service.py` URLs, timeout, cache TTL, description max length all from config
76. `mock_interview.py` spoken-typed mismatch threshold from config
77. `dsa.py` execution timeout (5s) and compile timeout (10s) from config
78. `ats_resume.py` all PDF layout constants (page size, margins, fonts, font sizes) from config
79. `pdf_service.py` OCR DPI and min text length from config
80. `progress.py` fixed mutable default argument `matched_skills: list[str] = []` → `None`
81. Landing page redesigned with blue + pink color combination — floating orbs, logo gradient, gauge SVG gradient, progress bars, step numbers, accent text all use `#818cf8` (blue) and `#f472b6` (pink)
82. `index.css` updated: `btn-primary` gradient blue→pink, card hover glow pink, `section-title` gradient text, `gradient-text`, `glow-line`, `card-gradient-bar`, `input-field:focus`, `progress-bar-fill`, `mesh-bg` all switched to blue/pink palette
83. NEW: Auto Portfolio Generator — backend (6 endpoints: generate, preview, download/{id}, download-live, list, delete), frontend (3-tab UI: Create, Preview, My Portfolios), LLM content generation, PyMuPDF sidebar layout PDF
84. NEW: Mock interview speech analysis — client-side filler word detection (12 fillers), real-time WPM calculation, speech duration tracking, backend aggregates metrics + LLM evaluates speech quality
85. Mock interview enhanced: structure type analysis (STAR/Technical/Unstructured) per question, speech_analysis section in LLM prompt, structure_type/structure_feedback per question score
86. Mock interview: speech indicators during recording (WPM gauge, filler counter, speech duration), Speech Analysis results card with 4-stat grid + 4 analysis panels + improvement tips
87. Fixed unanswered question scoring — empty answers now get score 0 with "Skipped" badge, excluded from LLM prompt, skip confirmation modal in frontend
88. Fixed fallback evaluation to check both typed_answer AND spoken_answer (was only checking typed_answer)
89. Fixed progress counter to only count actually answered questions
10. Backend config expanded: interview_question_time_seconds, interview_question_counts, interview_roles, interview_topics, interview_difficulties, interview_speech_language
91. New GET /mock-interview/config endpoint serves all interview config to frontend
92. Fallback questions now difficulty-aware (easy/medium/hard have different question pools)
93. Frontend MockInterview.jsx: all hardcoded values (roles, topics, time, counts, filler words, WPM thresholds, speech language) now fetched from config endpoint
94. NEW: Skill normalization service (`skill_normalization_service.py`) — builds alias→canonical lookup from MongoDB `skills.aliases`, normalizes resume skills and job tags before matching
95. Job matching enhanced: bidirectional scoring (60% tag coverage + 40% resume coverage), skill alias normalization, missing_skills returned in response
96. Frontend JobListings.jsx: shows missing skills in peach color alongside matched skills
97. NEW: Shared component library (`components/shared/`) — 11 reusable components: ScoreRing, ProgressBar, DifficultyBadge, PageHeader, SectionLabel, Pill, ChartImage, GradientCard, StatCard, LoadingSpinner, EmptyState
98. Created `components/AuthLayout.jsx` — shared login/register layout (orbs, logo, card, gradient bar) reducing each page from ~195 lines to ~60 lines
99. MockInterview.jsx split into 4 files: orchestrator (~200 lines) + SetupPhase.jsx + InterviewPhase.jsx + ResultsPhase.jsx — down from 2177 lines
100. Added CSS utility classes to `index.css`: `.section-label`, `.stat-card`, `.auth-page`, `.auth-card`, `.auth-logo`, `.auth-field`, `.auth-bottom-link`
101. DSA Practice: extracted `LanguageBar`, `CodeEditor`, `RunResults`, `ProblemDescription` components + `constants.js` — down from 799 lines

## Planned Features

### 1. Vector-Based Job Matching (DEFERRED)
- **Decision**: Current tag-set-intersection + alias normalization + bidirectional scoring is sufficient for ~200 jobs
- **Reason**: Sentence transformers produce noisy scores on 2-5 word tags; alias mapping solves the actual matching failures; FAISS adds complexity for zero latency benefit at current scale
- **If scale grows to 10k+ jobs**: Revisit with full resume text embedding + FAISS IndexFlatIP

### 2. Enhanced Mock Interview — Filler Words, Speaking Pace, Answer Structure (COMPLETED)
- **Status**: Implemented and deployed
- **What was built**: Client-side filler detection, real-time WPM, speech metrics in API, LLM speech analysis, structure scoring, skip confirmation, speech analysis results card
