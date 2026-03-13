"""
Patient document model for MongoDB via Beanie.
"""

from datetime import date, datetime
from typing import Optional
from uuid import UUID, uuid4

from beanie import Document, Indexed
from pydantic import Field


class Patient(Document):
    id: UUID = Field(default_factory=uuid4)
    practice_id: Indexed(str)  # type: ignore[valid-type]
    full_name: str
    dob: date
    member_id: str
    insurance_payer: str
    insurance_plan: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "patients"
