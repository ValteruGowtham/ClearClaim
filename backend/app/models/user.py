"""
User document model for MongoDB via Beanie.
"""

from datetime import datetime
from typing import Literal
from uuid import UUID, uuid4

from beanie import Document, Indexed
from pydantic import Field


class User(Document):
    id: UUID = Field(default_factory=uuid4)
    email: Indexed(str, unique=True)  # type: ignore[valid-type]
    hashed_password: str
    full_name: str
    practice_name: str
    practice_type: str | None = None
    physician_count: str | None = None
    primary_specialty: str | None = None
    phone: str | None = None
    role: Literal["admin", "biller", "provider", "readonly"] = "biller"
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "users"
