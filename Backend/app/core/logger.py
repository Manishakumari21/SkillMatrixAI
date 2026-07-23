import json
import logging
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from app.core.config import get_settings

settings = get_settings()
logger = logging.getLogger("SkillMatrixAI")
logger.setLevel(settings.log_level)

if not logger.handlers:
    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(logging.Formatter("%(asctime)s - %(name)s - %(levelname)s - %(message)s"))
    logger.addHandler(handler)

ERROR_LOG_PATH = Path(settings.error_log_path)


def log_error(details: dict[str, Any]) -> None:
    entry = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "user_id": details.get("user_id"),
        "endpoint": details.get("endpoint"),
        "provider": details.get("provider"),
        "error_type": details.get("error_type"),
        "attempt": details.get("attempt"),
        "stage": details.get("stage"),
        "message": details.get("message"),
    }

    logger.warning("ERROR_LOG %s", json.dumps(entry))

    with ERROR_LOG_PATH.open("a", encoding="utf-8") as f:
        f.write(json.dumps(entry) + "\n")
