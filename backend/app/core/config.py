# backend/app/core/config.py

from pydantic import BaseSettings, AnyUrl

class Settings(BaseSettings):
    api_host: str = "0.0.0.0"
    api_port: int = 8000
    debug: bool = False
    mongodb_uri: AnyUrl  # Ensures the URI is a valid URL

    class Config:
        env_file = ".env"

settings = Settings()
