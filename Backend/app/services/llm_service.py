import time

from app.core.config import get_settings
from app.core.logger import log_error, logger

settings = get_settings()


def call_ai_api_safe(prompt, groq_api_key: str | None = None, gemini_api_key: str | None = None):
    """Call an LLM using the CURRENT USER's keys only.

    Security contract:
    - Keys are supplied per-request by the caller after decrypting the
      authenticated user's own stored key.
    - There is deliberately NO fallback to the server's env keys and no
      cross-user lookup. A user without a key gets rule-based output, never
      someone else's quota. This is what prevents key leakage between accounts.
    """
    groq_api_key = (groq_api_key or "").strip()
    gemini_api_key = (gemini_api_key or "").strip()

    if not groq_api_key and not gemini_api_key:
        logger.info("No user API keys configured, skipping LLM call")
        return None

    try:
        return _call_groq(prompt, groq_api_key)
    except Exception as e:
        log_error({
            "stage": "llm_call_failed",
            "provider": "groq",
            "error_type": type(e).__name__,
            "message": str(e),
        })

        time.sleep(settings.llm_retry_wait_seconds)

        try:
            return _call_groq(prompt, groq_api_key)
        except Exception as e:
            log_error({
                "stage": "llm_call_failed_retry",
                "provider": "groq",
                "error_type": type(e).__name__,
                "message": str(e),
            })

            try:
                return _call_gemini(prompt, gemini_api_key)
            except Exception as e:
                log_error({
                    "stage": "gemini_fallback_failed",
                    "provider": "gemini",
                    "error_type": type(e).__name__,
                    "message": str(e),
                })
                return None


def _call_groq(prompt, api_key: str):
    from groq import Groq

    client = Groq(api_key=api_key)
    response = client.chat.completions.create(
        model=settings.llm_model_name,
        messages=[{"role": "user", "content": prompt}],
        timeout=settings.llm_timeout_seconds,
    )
    return response.choices[0].message.content


def _call_gemini(prompt, api_key: str):
    import google.generativeai as genai

    genai.configure(api_key=api_key)
    model = genai.GenerativeModel("gemini-2.0-flash")
    response = model.generate_content(prompt)
    return response.text


def validate_groq_key(api_key: str) -> tuple[bool, str | None]:
    """Verify a user's Groq key against the provider before we store it."""
    try:
        _call_groq("ping", api_key)
        return True, None
    except Exception as e:
        return False, type(e).__name__


def validate_gemini_key(api_key: str) -> tuple[bool, str | None]:
    """Verify a user's Gemini key against the provider before we store it."""
    try:
        _call_gemini("ping", api_key)
        return True, None
    except Exception as e:
        return False, type(e).__name__