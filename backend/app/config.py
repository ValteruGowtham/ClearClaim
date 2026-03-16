from functools import lru_cache
import os
from typing import Optional

from pydantic import AliasChoices, Field
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # MongoDB
    MONGO_URI: str = Field(
        default="mongodb://localhost:27017/clearclaim",
        validation_alias=AliasChoices("MONGO_URI", "MONGODB_URI", "MONGODB_URL"),
    )
    MONGO_DB_NAME: str = Field(
        default="clearclaim",
        validation_alias=AliasChoices("MONGO_DB_NAME", "DATABASE_NAME"),
    )

    # Auth / JWT
    SECRET_KEY: str = "change-me-to-a-random-secret-key"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    # Redis
    REDIS_URL: str = "redis://localhost:6379"

    # TinyFish
    TINYFISH_API_KEY: Optional[str] = None

    # AgentMail
    AGENTMAIL_API_KEY: Optional[str] = None
    AGENTMAIL_FROM_EMAIL: str = "noreply@clearclaim.ai"

    model_config = {"env_file": ".env", "extra": "ignore"}


@lru_cache
def get_settings() -> Settings:
    settings = Settings()

    # Backward compatibility for legacy env names used in older docs/compose files
    if "MONGO_URI" not in os.environ:
        legacy_mongo = os.getenv("MONGODB_URI") or os.getenv("MONGODB_URL")
        if legacy_mongo:
            settings.MONGO_URI = legacy_mongo

    if "MONGO_DB_NAME" not in os.environ:
        legacy_db = os.getenv("DATABASE_NAME")
        if legacy_db:
            settings.MONGO_DB_NAME = legacy_db

    if "SECRET_KEY" not in os.environ:
        legacy_secret = os.getenv("JWT_SECRET")
        if legacy_secret:
            settings.SECRET_KEY = legacy_secret

    return settings
