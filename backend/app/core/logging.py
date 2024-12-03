from loguru import logger
import sys

def setup_logging():
    logger.remove()  # Remove the default logger
    logger.add(sys.stdout, level="DEBUG" if settings.debug else "INFO",
               format="{time} {level} {message}", enqueue=True)
    # Optionally, add file logging
    logger.add("logs/app.log", rotation="10 MB", retention="10 days", compression="zip")
