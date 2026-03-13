"""
Patient routes — CRUD operations scoped to the current practice.
"""

from datetime import date, datetime
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from app.core.dependencies import get_current_user
from app.models.patient import Patient
from app.models.user import User

router = APIRouter(prefix="/patients", tags=["patients"])


# ── Request / Response schemas ──────────────────────────────────────


class PatientCreate(BaseModel):
    full_name: str
    dob: date
    member_id: str
    insurance_payer: str
    insurance_plan: Optional[str] = None


class PatientResponse(BaseModel):
    id: str
    practice_id: str
    full_name: str
    dob: date
    member_id: str
    insurance_payer: str
    insurance_plan: Optional[str] = None
    created_at: datetime


def _patient_response(p: Patient) -> PatientResponse:
    return PatientResponse(
        id=str(p.id),
        practice_id=p.practice_id,
        full_name=p.full_name,
        dob=p.dob,
        member_id=p.member_id,
        insurance_payer=p.insurance_payer,
        insurance_plan=p.insurance_plan,
        created_at=p.created_at,
    )


# ── Endpoints ───────────────────────────────────────────────────────


@router.get("/", response_model=list[PatientResponse])
async def list_patients(current_user: User = Depends(get_current_user)):
    """List all patients belonging to the current user's practice."""
    patients = await Patient.find(
        Patient.practice_id == str(current_user.id)
    ).to_list()
    return [_patient_response(p) for p in patients]


@router.post(
    "/",
    response_model=PatientResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_patient(
    body: PatientCreate,
    current_user: User = Depends(get_current_user),
):
    """Create a new patient under the current practice."""
    patient = Patient(
        practice_id=str(current_user.id),
        full_name=body.full_name,
        dob=body.dob,
        member_id=body.member_id,
        insurance_payer=body.insurance_payer,
        insurance_plan=body.insurance_plan,
    )
    await patient.insert()
    return _patient_response(patient)


@router.get("/{patient_id}", response_model=PatientResponse)
async def get_patient(
    patient_id: str,
    current_user: User = Depends(get_current_user),
):
    """Get a single patient by ID (scoped to the current practice)."""
    try:
        patient = await Patient.get(UUID(patient_id))
    except (ValueError, Exception):
        patient = None

    if not patient or patient.practice_id != str(current_user.id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found",
        )
    return _patient_response(patient)
