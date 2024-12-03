# backend/app/core/logging.py

from loguru import logger
import sys
from app.core.config import settings  # Import settings

def setup_logging():
    logger.remove()  # Remove the default logger
    logger.add(
        sys.stdout,
        level="DEBUG" if settings.debug else "INFO",
        format="{time} {level} {message}",
        enqueue=True
    )
    # File logging with rotation and retention policies
    logger.add(
        "logs/app.log",
        rotation="10 MB",
        retention="10 days",
        compression="zip",
        level="INFO"
    )
