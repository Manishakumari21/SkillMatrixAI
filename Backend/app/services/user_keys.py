"""Helpers for resolving the AUTHENTICATED user's own API keys.

Centralised so every LLM call site pulls keys the same way, and so the
no-cross-user-access rule is enforced in one place.
"""
from app.core.crypto import decrypt_key, mask_key
from app.models.user import User


def get_user_llm_keys(user: User) -> tuple[str, str]:
    """Return (groq_key, gemini_key) plaintext for this user only.

    Empty string means "not configured" and triggers the rule-based fallbacks.
    Never returns another user's keys and never falls back to server env keys.
    """
    return (
        decrypt_key(user.groq_api_key_encrypted) or "",
        decrypt_key(user.gemini_api_key_encrypted) or "",
    )


def describe_user_keys(user: User) -> dict:
    """Safe, non-reversible description of which keys this user has saved."""
    groq, gemini = get_user_llm_keys(user)
    return {
        "groq_configured": bool(groq),
        "gemini_configured": bool(gemini),
        "groq_hint": mask_key(groq),
        "gemini_hint": mask_key(gemini),
    }