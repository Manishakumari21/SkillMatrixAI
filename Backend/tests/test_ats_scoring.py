"""Pure unit tests — no MongoDB required."""
from app.services.ats_score_service import (
    _score_format, _score_keywords, _score_length, _score_quantified_results,
)


def test_keywords_empty_jd_returns_default():
    score, matches, missing = _score_keywords("python developer", "")
    assert score == 70
    assert matches == [] and missing == []


def test_keywords_full_match_scores_100():
    score, matches, _ = _score_keywords(
        "python fastapi mongodb developer", "python fastapi mongodb"
    )
    assert score == 100
    assert set(matches) >= {"python", "fastapi", "mongodb"}


def test_format_rewards_contact_and_sections():
    text = ("John Doe john@example.com +1-555-0100\n"
            "Experience at Acme. Education B.Tech. Skills Python. Summary built apps. " * 5)
    assert _score_format(text) >= 60


def test_format_empty_resume_scores_low():
    assert _score_format("hi") < 60


def test_quantified_tiers():
    assert _score_quantified_results("no numbers here at all") == 10
    assert _score_quantified_results("improved by 40% serving 100 users in 5 teams across 3 regions") == 60
    assert _score_quantified_results("1 2 3 4 5 6 7 8 9 teams regions users dollars percent growth scale") == 100


def test_length_optimal_range():
    assert _score_length("word " * 400) == 100
    assert _score_length("short") == 25
