"""
Task document model for MongoDB via Beanie — core of the app.
"""

from datetime import datetime
from typing import Any, Literal, Optional
from uuid import UUID, uuid4

from beanie import Document, Indexed
from pydantic import Field


class Task(Document):
    id: UUID = Field(default_factory=uuid4)
    practice_id: Indexed(str)  # type: ignore[valid-type]
    patient_id: Indexed(str)  # type: ignore[valid-type]
    patient_name: Optional[str] = None  # denormalised from Patient
    task_type: Literal["prior_auth", "eligibility", "claim_status", "appeal"]
    status: Literal[
        "pending", "in_progress", "completed", "failed", "requires_human"
    ] = "pending"
    payer: str
    procedure_code: Optional[str] = None  # CPT code
    diagnosis_code: Optional[str] = None  # ICD-10
    result: Optional[dict[str, Any]] = None  # stores agent response
    auth_number: Optional[str] = None  # filled on approval
    failure_reason: Optional[str] = None
    agent_trace: Optional[list[dict[str, Any]]] = None  # agent steps log

    # Live agent stream fields
    tinyfish_run_id: Optional[str] = None
    streaming_url: Optional[str] = None
    progress_steps: list[str] = Field(default_factory=list)

    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    completed_at: Optional[datetime] = None

    class Settings:
        name = "tasks"
