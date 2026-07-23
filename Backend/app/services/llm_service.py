import time
from app.core.config import get_settings
from app.core.logger import log_error, logger

settings = get_settings()


def call_ai_api_safe(prompt):
    if not settings.groq_api_key and not settings.gemini_api_key:
        logger.info("No LLM API keys configured, skipping LLM call")
        return None

    try:
        return _call_groq(prompt)
    except Exception as e:
        log_error({
            "stage": "llm_call_failed",
            "provider": "groq",
            "error_type": type(e).__name__,
            "message": str(e),
        })

        time.sleep(settings.llm_retry_wait_seconds)

        try:
            return _call_groq(prompt)
        except Exception as e:
            log_error({
                "stage": "llm_call_failed_retry",
                "provider": "groq",
                "error_type": type(e).__name__,
                "message": str(e),
            })

            try:
                return _call_gemini(prompt)
            except Exception as e:
                log_error({
                    "stage": "gemini_fallback_failed",
                    "provider": "gemini",
                    "error_type": type(e).__name__,
                    "message": str(e),
                })
                return None


def _call_groq(prompt):
    from groq import Groq

    client = Groq(api_key=settings.groq_api_key)
    response = client.chat.completions.create(
        model=settings.llm_model_name,
        messages=[{"role": "user", "content": prompt}],
        timeout=settings.llm_timeout_seconds,
    )
    return response.choices[0].message.content


def _call_gemini(prompt):
    import google.generativeai as genai

    genai.configure(api_key=settings.gemini_api_key)
    model = genai.GenerativeModel("gemini-2.0-flash")
    response = model.generate_content(prompt)
    return response.text
