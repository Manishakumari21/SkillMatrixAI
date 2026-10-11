
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel, EmailStr, Field

from app.core.logger import log_error, logger
from app.core.security import create_access_token, decode_access_token, hash_password, verify_password
from app.models.user import User
from app.services.email_service import send_password_reset_email
from app.services.password_reset import build_reset_url, consume_reset_token, issue_reset_token

router = APIRouter(prefix="/auth", tags=["auth"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: str | None = None

class UserOut(BaseModel):
    id: str | None = None
    email: EmailStr
    full_name: str | None = None

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
async def register(payload: RegisterRequest):
    existing = await User.find_one({"email": payload.email})
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")

    user = User(
        email=payload.email,
        hashed_password=hash_password(payload.password),
        full_name=payload.full_name,
    )
    await user.insert()
    logger.info("New user registered: %s", user.email)
    return UserOut(id=str(user.id), email=user.email, full_name=user.full_name)


async def get_current_user(token: str = Depends(oauth2_scheme)) -> User:
    subject = decode_access_token(token)
    if subject is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    user = await User.find_one({"email": subject})
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    return user


@router.post("/login", response_model=TokenResponse)
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    user = await User.find_one({"email": form_data.username})

    if user is None or not verify_password(form_data.password, user.hashed_password):
        log_error({
            "stage": "login_failed",
            "endpoint": "/auth/login",
            "error_type": "invalid_credentials",
            "message": f"Failed login attempt for {form_data.username}",
        })
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect email or password")

    token = create_access_token({"sub": user.email})
    return TokenResponse(access_token=token)


@router.get("/me", response_model=UserOut)
async def read_current_user(current_user: User = Depends(get_current_user)):
    return UserOut(id=str(current_user.id), email=current_user.email, full_name=current_user.full_name)


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str = Field(min_length=8, max_length=128)


@router.post("/forgot-password")
async def forgot_password(payload: ForgotPasswordRequest):
    """Start a password reset.

    Note: this endpoint deliberately reports whether the email is registered,
    which lets someone probe for valid accounts on this app. That was an
    explicit product decision; if that ever changes, return the success message
    unconditionally here instead.
    """
    user = await User.find_one({"email": payload.email})
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No account found with that email address",
        )

    raw_token = await issue_reset_token(payload.email)
    reset_url = build_reset_url(raw_token)
    emailed = send_password_reset_email(payload.email, reset_url)

    logger.info("Password reset requested for %s (emailed=%s)", payload.email, emailed)

    return {
        "message": "Password reset link sent. Please check your email.",
        # Useful for local development when SMTP is not configured; the link is
        # also written to the server log. Production deployments configure SMTP.
        "delivery": "email" if emailed else "log",
    }


@router.post("/reset-password")
async def reset_password(payload: ResetPasswordRequest):
    """Complete a password reset using a single-use emailed token."""
    user_email = await consume_reset_token(payload.token)
    if user_email is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This reset link is invalid or has expired. Please request a new one.",
        )

    user = await User.find_one({"email": user_email})
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This reset link is invalid or has expired. Please request a new one.",
        )

    user.hashed_password = hash_password(payload.new_password)
    await user.save()

    logger.info("Password reset completed for %s", user.email)
    return {"message": "Your password has been updated. You can now sign in."}   