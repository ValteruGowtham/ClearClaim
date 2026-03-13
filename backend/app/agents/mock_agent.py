"""
MockAgent — simulates realistic agent behaviour for every task type.
"""

import asyncio
import random
from datetime import datetime, timedelta

from app.agents.base_agent import BaseAgent
from app.models.task import Task


class MockAgent(BaseAgent):
    """Returns realistic mock results with a simulated processing delay."""

    async def execute(self, task: Task) -> dict:
        await self.log_step(task, "agent_started", {"task_type": task.task_type})

        # Simulate processing time
        await self.log_step(task, "contacting_payer", {"payer": task.payer})
        await asyncio.sleep(3)

        handler = {
            "prior_auth": self._prior_auth,
            "eligibility": self._eligibility,
            "claim_status": self._claim_status,
            "appeal": self._appeal,
        }.get(task.task_type)

        if handler is None:
            await self.log_step(task, "error", {"message": f"Unknown task_type: {task.task_type}"})
            raise ValueError(f"Unknown task_type: {task.task_type}")

        result = handler(task)
        await self.log_step(task, "agent_completed", {"result_status": result.get("status")})
        return result

    # ── Mock result generators ──────────────────────────────────────

    @staticmethod
    def _prior_auth(task: Task) -> dict:
        today = datetime.utcnow().date()
        auth_number = f"PA-MOCK-{random.randint(100000, 999999)}"
        return {
            "status": "approved",
            "auth_number": auth_number,
            "valid_from": today.isoformat(),
            "valid_until": (today + timedelta(days=180)).isoformat(),
            "approved_units": 1,
            "payer_response": "Authorization approved for requested procedure.",
        }

    @staticmethod
    def _eligibility(task: Task) -> dict:
        return {
            "status": "active",
            "coverage_active": True,
            "deductible_total": 2000,
            "deductible_met": 750,
            "out_of_pocket_max": 6000,
            "copay": 30,
            "payer_response": "Patient is active and eligible for services.",
        }

    @staticmethod
    def _claim_status(task: Task) -> dict:
        today = datetime.utcnow().date()
        return {
            "status": "in_review",
            "claim_number": f"CLM-MOCK-{random.randint(100000, 999999)}",
            "submitted_date": (today - timedelta(days=5)).isoformat(),
            "expected_resolution": (today + timedelta(days=10)).isoformat(),
            "payer_response": "Claim is currently under review.",
        }

    @staticmethod
    def _appeal(task: Task) -> dict:
        return {
            "status": "submitted",
            "appeal_reference": f"APL-MOCK-{random.randint(100000, 999999)}",
            "submitted_at": datetime.utcnow().isoformat(),
            "payer_response": "Appeal received and queued for medical review.",
        }
