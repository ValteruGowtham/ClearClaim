from pydantic_settings import BaseSettings
from functools import lru_cache
from typing import Optional


class Settings(BaseSettings):
    # MongoDB (include DB name in the URI, e.g. mongodb://localhost:27017/clearclaim)
    MONGO_URI: str = "mongodb://localhost:27017/clearclaim"

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
    return Settings()
