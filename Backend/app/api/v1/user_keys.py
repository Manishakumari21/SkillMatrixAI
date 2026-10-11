from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from app.api.v1.auth import get_current_user
from app.core.crypto import encrypt_key, mask_key
from app.core.logger import logger
from app.models.user import User
from app.services.llm_service import validate_gemini_key, validate_groq_key
from app.services.user_keys import describe_user_keys

router = APIRouter(prefix="/user", tags=["user-keys"])

class ApiKeysOut(BaseModel):
    groq_configured: bool
    gemini_configured: bool
    groq_hint: str | None = None
    gemini_hint: str | None = None

class ApiKeysUpdate(BaseModel):
    groq_api_key: str | None = Field(default=None, max_length=200)
    gemini_api_key: str | None = Field(default=None, max_length=200)
    clear_groq: bool = False
    clear_gemini: bool = False

@router.get("/api-keys", response_model=ApiKeysOut)
async def read_api_keys(current_user: User = Depends(get_current_user)):

    return ApiKeysOut(**describe_user_keys(current_user))

@router.put("/api-keys", response_model=ApiKeysOut)
async def update_api_keys(
    payload: ApiKeysUpdate,
    current_user: User = Depends(get_current_user),
):

    if payload.clear_groq:
        current_user.groq_api_key_encrypted = None
    if payload.clear_gemini:
        current_user.gemini_api_key_encrypted = None

    groq_key = (payload.groq_api_key or "").strip()
    gemini_key = (payload.gemini_api_key or "").strip()

    if groq_key:
        ok, error = validate_groq_key(groq_key)
        if not ok:
            raise HTTPException(
                status_code=400,
                detail=f"Groq API key rejected by provider ({error})",
            )
        current_user.groq_api_key_encrypted = encrypt_key(groq_key)

    if gemini_key:
        ok, error = validate_gemini_key(gemini_key)
        if not ok:
            raise HTTPException(
                status_code=400,
                detail=f"Gemini API key rejected by provider ({error})",
            )
        current_user.gemini_api_key_encrypted = encrypt_key(gemini_key)

    await current_user.save()
    logger.info("Updated API keys for user %s", current_user.email)

    return ApiKeysOut(**describe_user_keys(current_user))

@router.delete("/api-keys", response_model=ApiKeysOut)
async def delete_api_keys(current_user: User = Depends(get_current_user)):

    current_user.groq_api_key_encrypted = None
    current_user.gemini_api_key_encrypted = None
    await current_user.save()
    logger.info("Cleared API keys for user %s", current_user.email)

    return ApiKeysOut(
        groq_configured=False,
        gemini_configured=False,
        groq_hint=None,
        gemini_hint=None,
    )
