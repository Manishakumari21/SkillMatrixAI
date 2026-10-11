from app.core.crypto import decrypt_key, mask_key
from app.models.user import User

def get_user_llm_keys(user: User) -> tuple[str, str]:

    return (
        decrypt_key(user.groq_api_key_encrypted) or "",
        decrypt_key(user.gemini_api_key_encrypted) or "",
    )

def describe_user_keys(user: User) -> dict:

    groq, gemini = get_user_llm_keys(user)
    return {
        "groq_configured": bool(groq),
        "gemini_configured": bool(gemini),
        "groq_hint": mask_key(groq),
        "gemini_hint": mask_key(gemini),
    }
