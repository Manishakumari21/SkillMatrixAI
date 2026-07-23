from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # ── App ────────────────────────────────────────────────────────────
    app_name: str = "SkillMatrixAI"
    environment: str = "development"
    log_level: str = "INFO"
    error_log_path: str = "error.log"
    cors_origins: list[str] = ["http://localhost:5173", "http://localhost:3000", "http://localhost:4173"]

    # ── Database ───────────────────────────────────────────────────────
    mongo_uri: str = "mongodb://localhost:27017"
    db_name: str = "skillmatrix"

    # ── Auth ───────────────────────────────────────────────────────────
    jwt_secret: str
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60

    # ── LLM ────────────────────────────────────────────────────────────
    groq_api_key: str = " "
    gemini_api_key: str = " "
    primary_llm_provider: str = "groq"
    secondary_llm_provider: str = "gemini"
    llm_model_name: str = "llama-3.1-8b-instant"
    llm_timeout_seconds: int = 15
    llm_retry_wait_seconds: int = 3

    # ── Embeddings ─────────────────────────────────────────────────────
    embedding_model_name: str = "all-MiniLM-L6-v2"
    embedding_dimension: int = 384

    # ── Skill Extraction ───────────────────────────────────────────────
    min_skill_threshold: int = 4

    # ── Gap Analysis ───────────────────────────────────────────────────
    similarity_threshold: float = 0.55
    confidence_exact: float = 0.90
    confidence_high: float = 0.75

    # ── Roadmap ────────────────────────────────────────────────────────
    relevance_high: float = 0.70
    relevance_moderate: float = 0.40
    confidence_density_high: float = 0.3
    confidence_density_moderate: float = 0.1

    # ── History Caps ───────────────────────────────────────────────────
    gap_analyses_cap: int = 50
    demand_history_cap: int = 50

    # ── ATS Scoring ────────────────────────────────────────────────────
    ats_keyword_weight: float = 0.40
    ats_format_weight: float = 0.20
    ats_action_verb_weight: float = 0.15
    ats_quantified_weight: float = 0.15
    ats_length_weight: float = 0.10
    ats_top_keywords: int = 30
    ats_default_score: float = 70.0
    ats_word_count_optimal_min: int = 150
    ats_word_count_optimal_max: int = 600
    ats_quantified_tier1: int = 8
    ats_quantified_tier2: int = 5
    ats_quantified_tier3: int = 3
    ats_quantified_tier4: int = 1

    # ── Job APIs ───────────────────────────────────────────────────────
    remoteok_url: str = "https://remoteok.com/api"
    remotive_url: str = "https://remotive.com/api/remote-jobs"
    jobicy_url: str = "https://api.jobicy.com/v2/remote-jobs"
    job_api_timeout: int = 10
    job_cache_ttl: int = 900
    job_description_max_length: int = 500

    # ── Job Matching ───────────────────────────────────────────────────
    match_score_strong: int = 60
    match_score_weak: int = 30
    required_skills_weight: int = 70
    preferred_skills_weight: int = 30

    # ── Mock Interview ─────────────────────────────────────────────────
    spoken_typed_mismatch_threshold: float = 0.4
    interview_default_questions: int = 5
    interview_question_time_seconds: int = 180
    interview_question_counts: list[int] = [3, 5, 7, 10]
    interview_roles: list[str] = [
        "Software Engineer", "Data Scientist", "Frontend Developer",
        "Backend Developer", "DevOps Engineer", "ML Engineer",
        "Product Manager", "QA Engineer",
    ]
    interview_topics: list[str] = [
        "Data Structures", "System Design", "Algorithms", "Databases",
        "Networking", "OOP", "Web Development", "Cloud", "Security", "APIs",
    ]
    interview_difficulties: list[str] = ["easy", "medium", "hard"]
    interview_speech_language: str = "en-US"
    wpm_optimal_min: int = 100
    wpm_optimal_max: int = 160
    filler_words: list[str] = ["um", "uh", "like", "you know", "basically", "actually", "so", "right", "i mean", "kind of", "sort of", "literally"]

    # ── DSA Execution ──────────────────────────────────────────────────
    dsa_execution_timeout: int = 5
    dsa_compile_timeout: int = 10

    # ── Portfolio Generator ────────────────────────────────────────────
    portfolio_max_portfolios: int = 10
    portfolio_sidebar_ratio: float = 0.35
    portfolio_accent_r: float = 0.765
    portfolio_accent_g: float = 0.651
    portfolio_accent_b: float = 0.969

    # ── PDF / OCR ──────────────────────────────────────────────────────
    ocr_dpi: int = 200
    pdf_text_min_length: int = 50
    pdf_page_width: int = 612
    pdf_page_height: int = 792
    pdf_margin_left: int = 54
    pdf_margin_right: int = 54
    pdf_margin_top: int = 50
    pdf_font_name: str = "helv"
    pdf_font_bold: str = "hebo"
    pdf_title_size: int = 18
    pdf_section_size: int = 10
    pdf_heading_size: float = 9.5
    pdf_body_size: int = 9
    pdf_small_size: float = 8.5

    # ── Visualization ──────────────────────────────────────────────────
    chart_dpi: int = 150
    max_radar_categories: int = 12
    max_skill_bars: int = 15
    max_roadmap_skills: int = 12

    # ── Colors (Rosé Pine) ─────────────────────────────────────────────
    color_bg: str = "#1e1e2e"
    color_surface: str = "#313244"
    color_text: str = "#cdd6f4"
    color_subtext: str = "#a6adc8"
    color_overlay: str = "#6c7086"
    color_accent1: str = "#cba6f7"
    color_accent2: str = "#b4befe"
    color_green: str = "#a6e3a1"
    color_yellow: str = "#f9e2af"
    color_red: str = "#f38ba8"
    color_blue: str = "#89b4fa"
    color_peach: str = "#fab387"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
