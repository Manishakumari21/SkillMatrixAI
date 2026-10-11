import smtplib
from email.message import EmailMessage

from app.core.config import get_settings
from app.core.logger import logger

settings = get_settings()

def _smtp_configured() -> bool:
    return bool(settings.smtp_host)

def _send_via_smtp(message: EmailMessage) -> None:
    with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=15) as server:
        if settings.smtp_use_tls:
            server.starttls()
        if settings.smtp_user:
            server.login(settings.smtp_user, settings.smtp_password)
        server.send_message(message)

def send_password_reset_email(to_email: str, reset_url: str) -> bool:

    message = EmailMessage()
    message["Subject"] = "Reset your SkillMatrixAI password"
    message["From"] = settings.email_from
    message["To"] = to_email
    message.set_content(
        f"Hi,\n\n"
        f"We received a request to reset your SkillMatrixAI password.\n\n"
        f"Click the link below to choose a new password. "
        f"It expires in {settings.password_reset_expire_minutes} minutes "
        f"and can only be used once.\n\n"
        f"{reset_url}\n\n"
        f"If you did not request this, you can safely ignore this email — "
        f"your password will not change.\n"
    )

    if not _smtp_configured():

        logger.warning(
            "SMTP not configured; password reset link for %s (logged, not emailed): %s",
            to_email,
            reset_url,
        )
        return False

    try:
        _send_via_smtp(message)
        logger.info("Password reset email sent to %s", to_email)
        return True
    except Exception as exc:

        log_error_smtp(to_email, exc)
        return False

def log_error_smtp(to_email: str, exc: Exception) -> None:
    from app.core.logger import log_error

    log_error({
        "stage": "smtp_send_failed",
        "endpoint": "/auth/forgot-password",
        "error_type": type(exc).__name__,
        "message": str(exc),
        "recipient": to_email,
    })
