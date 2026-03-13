"""
Claim document model for MongoDB via Beanie.
"""

from datetime import datetime
from enum import Enum
from typing import Optional

from beanie import Document
from pydantic import Field


class ClaimStatus(str, Enum):
    DRAFT = "draft"
    SUBMITTED = "submitted"
    IN_REVIEW = "in_review"
    APPROVED = "approved"
    DENIED = "denied"


class Claim(Document):
    patient_name: str
    provider_name: str
    claim_amount: float
    status: ClaimStatus = ClaimStatus.DRAFT
    description: Optional[str] = None
    submitted_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "claims"
