from fastapi import FastAPI
from app.api import routes
from app.core.config import settings
from app.core.logging import setup_logging

setup_logging()

app = FastAPI(title="Mirror Progress API", debug=settings.debug)

app.include_router(routes.router)

@app.on_event("startup")
async def startup_event():
    logger.info("Starting up the application")

@app.on_event("shutdown")
async def shutdown_event():
    logger.info("Shutting down the application")
