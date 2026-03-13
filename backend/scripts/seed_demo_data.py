#!/usr/bin/env python3
"""
seed_demo_data.py — Populate MongoDB with realistic demo data for investor demos.

Usage:
    python scripts/seed_demo_data.py          # Add demo data (skip if exists)
    python scripts/seed_demo_data.py --reset  # Clear demo data first, then re-seed
"""

import argparse
import asyncio
import sys
import os
from datetime import datetime, timedelta, timezone, date
from uuid import uuid4
import random

# Ensure the backend package is importable when run from repo root
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie

from app.config import get_settings
from app.core.security import hash_password
from app.models.user import User
from app.models.patient import Patient
from app.models.task import Task

# ── Demo constants ────────────────────────────────────────────────────────────

DEMO_EMAIL = "demo@clearclaim.ai"
DEMO_PASSWORD = "Demo1234!"
DEMO_PRACTICE_NAME = "Demo Medical Clinic"

DEMO_PATIENTS = [
    {
        "full_name": "Sarah Johnson",
        "dob": date(1985, 4, 12),
        "member_id": "UHC-882710-SJ",
        "insurance_payer": "UnitedHealthcare",
        "insurance_plan": "Choice Plus PPO",
    },
    {
        "full_name": "Michael Chen",
        "dob": date(1978, 9, 3),
        "member_id": "BCBS-541930-MC",
        "insurance_payer": "Blue Cross Blue Shield",
        "insurance_plan": "BlueSelect Silver",
    },
    {
        "full_name": "Emily Rodriguez",
        "dob": date(1992, 1, 27),
        "member_id": "AET-663421-ER",
        "insurance_payer": "Aetna",
        "insurance_plan": "Aetna Open Access HMO",
    },
    {
        "full_name": "James Williams",
        "dob": date(1965, 11, 8),
        "member_id": "CGN-774552-JW",
        "insurance_payer": "Cigna",
        "insurance_plan": "Open Access Plus",
    },
    {
        "full_name": "Patricia Davis",
        "dob": date(1971, 6, 19),
        "member_id": "HUM-119843-PD",
        "insurance_payer": "Humana",
        "insurance_plan": "HumanaChoice PPO",
    },
    {
        "full_name": "Robert Martinez",
        "dob": date(1958, 3, 30),
        "member_id": "MCD-002981-RM",
        "insurance_payer": "Medicaid",
        "insurance_plan": "Medicaid Managed Care",
    },
]

CPT_CODES = ["72148", "99213", "27447", "70553", "43239", "93306", "64483", "29827"]
ICD10_CODES = ["M54.5", "Z12.11", "M17.11", "G43.909", "K21.0", "I10", "M51.16", "M75.100"]

FAILURE_REASONS = [
    "Missing clinical documentation — prior auth not on file",
    "Procedure not covered under current plan year",
    "Requires peer-to-peer review with medical director",
    "Duplicate submission detected — review claim #CL-2024-1182",
]

HUMAN_REVIEW_STEPS = [
    "Agent navigated to payer portal and logged in. Auth form requires physician signature — uploading to queue for provider.",
    "Eligibility check complete. Plan has $2,400 deductible remaining. Manual verification needed for secondary coverage.",
    "Claim submission paused — payer requires itemized operative report. Please attach and resubmit.",
]

PAYER_RESPONSES = {
    "UnitedHealthcare": "Authorization approved. Service dates valid for 90 days from authorization date. Ref: UHC-PRIOR-AUTH.",
    "Blue Cross Blue Shield": "Prior authorization approved pending receipt of clinical notes. Contact provider relations at 1-800-521-2227.",
    "Aetna": "Authorization approved. Member eligibility confirmed. Copay applies per EOB.",
    "Cigna": "Authorization granted. Please reference auth number on all claims submissions.",
    "Humana": "Approved — care coordination team notified. Member wellness program enrollment recommended.",
    "Medicaid": "Authorization approved under managed care contract. Submit claims within 180 days of service.",
}


def days_ago(n: int) -> datetime:
    return datetime.now(timezone.utc) - timedelta(days=n)


def rand_past(max_days: int = 14) -> datetime:
    return days_ago(random.randint(0, max_days))


async def seed(reset: bool = False) -> None:
    settings = get_settings()
    client = AsyncIOMotorClient(settings.MONGO_URI)
    db = client.get_default_database()
    await init_beanie(database=db, document_models=[User, Patient, Task])

    # ── 1. Demo user ─────────────────────────────────────────────────
    user = await User.find_one(User.email == DEMO_EMAIL)
    if reset and user:
        print(f"  ⟳  Resetting demo data for {DEMO_EMAIL}...")
        practice_id = str(user.id)
        deleted_tasks = await Task.find(Task.practice_id == practice_id).delete()
        deleted_patients = await Patient.find(Patient.practice_id == practice_id).delete()
        print(f"     Deleted {deleted_tasks} tasks, {deleted_patients} patients.")

    if not user:
        user = User(
            email=DEMO_EMAIL,
            hashed_password=hash_password(DEMO_PASSWORD),
            full_name="Demo User",
            practice_name=DEMO_PRACTICE_NAME,
            role="admin",
        )
        await user.insert()
        print(f"  ✓  Created demo user: {DEMO_EMAIL}")
    else:
        print(f"  ✓  Demo user exists: {DEMO_EMAIL}")

    practice_id = str(user.id)

    # ── 2. Patients ──────────────────────────────────────────────────
    existing_patients = await Patient.find(Patient.practice_id == practice_id).to_list()
    existing_names = {p.full_name for p in existing_patients}

    patient_map: dict[str, Patient] = {p.full_name: p for p in existing_patients}
    for pdata in DEMO_PATIENTS:
        if pdata["full_name"] in existing_names and not reset:
            print(f"  — Patient already exists: {pdata['full_name']}")
            continue
        p = Patient(
            practice_id=practice_id,
            full_name=pdata["full_name"],
            dob=pdata["dob"],
            member_id=pdata["member_id"],
            insurance_payer=pdata["insurance_payer"],
            insurance_plan=pdata["insurance_plan"],
        )
        await p.insert()
        patient_map[pdata["full_name"]] = p
        print(f"  ✓  Patient: {pdata['full_name']} ({pdata['insurance_payer']})")

    patients = list(patient_map.values())
    if not patients:
        print("  ✗  No patients available — aborting task seed.")
        return

    # ── 3. Tasks ─────────────────────────────────────────────────────
    existing_task_count = await Task.find(Task.practice_id == practice_id).count()
    if existing_task_count >= 20 and not reset:
        print(f"  — {existing_task_count} tasks already exist — skipping task seed (use --reset).")
        return

    task_configs = [
        # 12 completed tasks
        {
            "status": "completed", "task_type": "prior_auth",
            "patient": "Sarah Johnson", "payer": "UnitedHealthcare",
            "procedure_code": "72148", "diagnosis_code": "M54.5",
            "auth_number": "PA-UHC-2024-88271",
            "result": {
                "approved": True, "auth_number": "PA-UHC-2024-88271",
                "coverage_active": True,
                "payer_response": PAYER_RESPONSES["UnitedHealthcare"],
            },
            "days_ago": random.randint(1, 3),
        },
        {
            "status": "completed", "task_type": "eligibility",
            "patient": "Michael Chen", "payer": "Blue Cross Blue Shield",
            "procedure_code": "99213", "diagnosis_code": "I10",
            "result": {
                "coverage_active": True, "deductible": 1500.0,
                "deductible_met": 820.0, "copay": 35.0,
                "out_of_pocket_max": 4500.0, "out_of_pocket_met": 1240.0,
                "payer_response": "Coverage verified. Plan active through 12/31/2026.",
            },
            "days_ago": random.randint(1, 4),
        },
        {
            "status": "completed", "task_type": "claim_status",
            "patient": "Emily Rodriguez", "payer": "Aetna",
            "procedure_code": "43239", "diagnosis_code": "K21.0",
            "result": {
                "claim_status": "paid", "claim_number": "AET-CLM-2025-10934",
                "amount_billed": 1250.0, "amount_paid": 875.0, "patient_responsibility": 375.0,
                "payer_response": "Claim processed and paid. EFT deposited 3/8/2026.",
            },
            "days_ago": random.randint(2, 5),
        },
        {
            "status": "completed", "task_type": "prior_auth",
            "patient": "James Williams", "payer": "Cigna",
            "procedure_code": "27447", "diagnosis_code": "M17.11",
            "auth_number": "PA-CGN-2025-55182",
            "result": {
                "approved": True, "auth_number": "PA-CGN-2025-55182",
                "coverage_active": True,
                "payer_response": PAYER_RESPONSES["Cigna"],
            },
            "days_ago": random.randint(2, 6),
        },
        {
            "status": "completed", "task_type": "eligibility",
            "patient": "Patricia Davis", "payer": "Humana",
            "procedure_code": "93306", "diagnosis_code": "I10",
            "result": {
                "coverage_active": True, "deductible": 2000.0,
                "deductible_met": 1800.0, "copay": 50.0,
                "payer_response": PAYER_RESPONSES["Humana"],
            },
            "days_ago": random.randint(3, 7),
        },
        {
            "status": "completed", "task_type": "prior_auth",
            "patient": "Robert Martinez", "payer": "Medicaid",
            "procedure_code": "70553", "diagnosis_code": "G43.909",
            "auth_number": "PA-MCD-2025-00814",
            "result": {
                "approved": True, "auth_number": "PA-MCD-2025-00814",
                "coverage_active": True,
                "payer_response": PAYER_RESPONSES["Medicaid"],
            },
            "days_ago": random.randint(3, 8),
        },
        {
            "status": "completed", "task_type": "claim_status",
            "patient": "Sarah Johnson", "payer": "UnitedHealthcare",
            "procedure_code": "99213", "diagnosis_code": "M54.5",
            "result": {
                "claim_status": "paid", "claim_number": "UHC-CLM-2025-77430",
                "amount_billed": 320.0, "amount_paid": 256.0, "patient_responsibility": 64.0,
                "payer_response": "Claim adjudicated. Check issued.",
            },
            "days_ago": random.randint(4, 8),
        },
        {
            "status": "completed", "task_type": "eligibility",
            "patient": "James Williams", "payer": "Cigna",
            "procedure_code": "64483", "diagnosis_code": "M51.16",
            "result": {
                "coverage_active": True, "deductible": 3000.0,
                "deductible_met": 3000.0, "copay": 0.0,
                "payer_response": "Deductible fully met. Plan covers 80% after deductible.",
            },
            "days_ago": random.randint(5, 9),
        },
        {
            "status": "completed", "task_type": "prior_auth",
            "patient": "Emily Rodriguez", "payer": "Aetna",
            "procedure_code": "29827", "diagnosis_code": "M75.100",
            "auth_number": "PA-AET-2025-32217",
            "result": {
                "approved": True, "auth_number": "PA-AET-2025-32217",
                "coverage_active": True,
                "payer_response": PAYER_RESPONSES["Aetna"],
            },
            "days_ago": random.randint(6, 10),
        },
        {
            "status": "completed", "task_type": "claim_status",
            "patient": "Michael Chen", "payer": "Blue Cross Blue Shield",
            "procedure_code": "99213", "diagnosis_code": "I10",
            "result": {
                "claim_status": "pending", "claim_number": "BCBS-CLM-2025-88213",
                "amount_billed": 210.0, "amount_paid": 0.0, "patient_responsibility": 0.0,
                "payer_response": "Claim in adjudication. Expected processing within 5 business days.",
            },
            "days_ago": random.randint(7, 11),
        },
        {
            "status": "completed", "task_type": "appeal",
            "patient": "Patricia Davis", "payer": "Humana",
            "procedure_code": "93306", "diagnosis_code": "I10",
            "result": {
                "approved": True, "auth_number": "APPEAL-HUM-2025-4421",
                "coverage_active": True,
                "payer_response": "Appeal approved. Original denial overturned. Payment issued.",
            },
            "days_ago": random.randint(8, 12),
        },
        {
            "status": "completed", "task_type": "prior_auth",
            "patient": "Robert Martinez", "payer": "Medicaid",
            "procedure_code": "72148", "diagnosis_code": "M54.5",
            "auth_number": "PA-MCD-2025-01192",
            "result": {
                "approved": True, "auth_number": "PA-MCD-2025-01192",
                "coverage_active": True,
                "payer_response": PAYER_RESPONSES["Medicaid"],
            },
            "days_ago": random.randint(9, 14),
        },
        # 3 in_progress
        {
            "status": "in_progress", "task_type": "prior_auth",
            "patient": "Sarah Johnson", "payer": "UnitedHealthcare",
            "procedure_code": "70553", "diagnosis_code": "G43.909",
            "days_ago": 0,
        },
        {
            "status": "in_progress", "task_type": "eligibility",
            "patient": "Michael Chen", "payer": "Blue Cross Blue Shield",
            "procedure_code": "99213", "diagnosis_code": "I10",
            "days_ago": 0,
        },
        {
            "status": "in_progress", "task_type": "claim_status",
            "patient": "Emily Rodriguez", "payer": "Aetna",
            "procedure_code": "43239", "diagnosis_code": "K21.0",
            "days_ago": 0,
        },
        # 2 requires_human
        {
            "status": "requires_human", "task_type": "prior_auth",
            "patient": "James Williams", "payer": "Cigna",
            "procedure_code": "27447", "diagnosis_code": "M17.11",
            "failure_reason": HUMAN_REVIEW_STEPS[0],
            "days_ago": 1,
        },
        {
            "status": "requires_human", "task_type": "eligibility",
            "patient": "Patricia Davis", "payer": "Humana",
            "procedure_code": "93306", "diagnosis_code": "I10",
            "failure_reason": HUMAN_REVIEW_STEPS[1],
            "days_ago": 2,
        },
        # 2 failed
        {
            "status": "failed", "task_type": "claim_status",
            "patient": "Robert Martinez", "payer": "Medicaid",
            "procedure_code": "70553", "diagnosis_code": "G43.909",
            "failure_reason": FAILURE_REASONS[0],
            "days_ago": 3,
        },
        {
            "status": "failed", "task_type": "prior_auth",
            "patient": "Sarah Johnson", "payer": "UnitedHealthcare",
            "procedure_code": "29827", "diagnosis_code": "M75.100",
            "failure_reason": FAILURE_REASONS[2],
            "days_ago": 5,
        },
        # 1 pending
        {
            "status": "pending", "task_type": "prior_auth",
            "patient": "Michael Chen", "payer": "Blue Cross Blue Shield",
            "procedure_code": "72148", "diagnosis_code": "M54.5",
            "days_ago": 0,
        },
    ]

    created = 0
    for cfg in task_configs:
        patient = patient_map.get(cfg["patient"])
        if not patient:
            print(f"  ✗  Patient not found: {cfg['patient']} — skipping task.")
            continue

        days = cfg.get("days_ago", random.randint(0, 14))
        base_time = days_ago(days)
        completed_at = None
        if cfg["status"] == "completed":
            completed_at = base_time + timedelta(minutes=random.randint(2, 8))

        task = Task(
            practice_id=practice_id,
            patient_id=str(patient.id),
            patient_name=patient.full_name,
            task_type=cfg["task_type"],
            status=cfg["status"],
            payer=cfg["payer"],
            procedure_code=cfg.get("procedure_code"),
            diagnosis_code=cfg.get("diagnosis_code"),
            result=cfg.get("result"),
            auth_number=cfg.get("auth_number"),
            failure_reason=cfg.get("failure_reason"),
            created_at=base_time,
            updated_at=completed_at or base_time,
            completed_at=completed_at,
        )
        await task.insert()
        created += 1
        print(f"  ✓  Task: [{cfg['status'].upper():16}] {cfg['task_type']} — {cfg['patient']}")

    print(f"\n  ✅  Seed complete: {len(patients)} patients, {created} tasks created.")
    print(f"      Login at: http://localhost:3000/login")
    print(f"      Email:    {DEMO_EMAIL}")
    print(f"      Password: {DEMO_PASSWORD}\n")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Seed ClearClaim demo data")
    parser.add_argument(
        "--reset", action="store_true", help="Delete existing demo data before seeding"
    )
    args = parser.parse_args()

    print("\n🌱  ClearClaim Demo Data Seeder\n" + "─" * 40)
    asyncio.run(seed(reset=args.reset))
