"""
TinyFish-backed real web automation agent.
"""

import asyncio
import json
from datetime import date, datetime
from typing import Any

import httpx
from tinyfish import TinyFish

from app.agents.base_agent import BaseAgent
from app.agents.goal_builder import GoalBuilder
from app.agents.payer_registry import PayerRegistry
from app.agents.result_parser import ResultParser
from app.config import get_settings
from app.models.patient import Patient
from app.models.task import Task


class TinyFishAgent(BaseAgent):
    def __init__(self) -> None:
        super().__init__()
        self.client = TinyFish()
        self.settings = get_settings()
        self.base_url = "https://api.tinyfish.ai"

    async def _append_progress(self, task: Task, message: str) -> None:
        """Append a progress message to the task's progress_steps list."""
        task.progress_steps.append(message)
        task.updated_at = datetime.utcnow()
        await task.save()

    async def execute(self, task: Task) -> dict[str, Any]:
        await self.log_step(task, "tinyfish_agent_started", {"task_type": task.task_type})

        try:
            payer_profile = PayerRegistry.get_by_name(task.payer)
            await self.log_step(
                task,
                "payer_profile_resolved",
                {
                    "payer": payer_profile.display_name,
                    "portal_url": payer_profile.portal_url,
                    "browser_profile": payer_profile.browser_profile,
                },
            )

            context = await self._build_context(task)
            goal = GoalBuilder.build_goal(task, context)
            await self.log_step(task, "goal_built", {"goal_preview": goal[:260]})

            run_id = await self._start_run(task, payer_profile.portal_url, payer_profile.browser_profile, goal)
            raw_result = await self._poll_run(task, run_id)
            normalized = ResultParser.parse(task.task_type, raw_result)

            await self.log_step(
                task,
                "result_parsed",
                {
                    "task_status": normalized.get("task_status"),
                    "status": normalized.get("status"),
                },
            )
            return normalized

        except Exception as exc:
            await self.log_step(
                task,
                "tinyfish_exception",
                {"error": str(exc)},
            )
            # Prefer manual review over hard-failure for healthcare workflows
            task.status = "requires_human"
            task.failure_reason = f"TinyFish error: {exc}"
            await task.save()
            raise

    async def _build_context(self, task: Task) -> dict[str, str]:
        patient_name = "Unknown Patient"
        patient_dob = "Unknown"
        member_id = "Unknown"
        insurance_plan = "Unknown"

        patient = await Patient.get(task.patient_id)
        if patient:
            patient_name = patient.full_name
            patient_dob = patient.dob.isoformat() if patient.dob else "Unknown"
            member_id = patient.member_id
            insurance_plan = patient.insurance_plan or "Unknown"

        return {
            "patient_name": patient_name,
            "patient_dob": patient_dob,
            "member_id": member_id,
            "insurance_plan": insurance_plan,
            "npi": "Unknown",
            "procedure_code": task.procedure_code or "Unknown",
            "diagnosis_code": task.diagnosis_code or "Unknown",
            "procedure_description": "Requested medical service",
            "today": date.today().isoformat(),
            "date_of_service": date.today().isoformat(),
            "claim_number": "Unknown",
            "appeal_reason": "Please reconsider claim denial based on medical necessity.",
        }

    async def _start_run(
        self,
        task: Task,
        portal_url: str,
        browser_profile: str,
        goal: str,
    ) -> str:
        await self.log_step(task, "run_async_starting", {"url": portal_url})

        payload = {
            "url": portal_url,
            "goal": goal,
            "browser_profile": browser_profile,
            "mode": "run-async",
        }

        headers = {
            "Authorization": f"Bearer {self.settings.TINYFISH_API_KEY}",
            "Content-Type": "application/json",
        }

        # Keep self.client initialized (SDK may evolve); use HTTP endpoint explicitly
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                f"{self.base_url}/v1/runs/run-async",
                headers=headers,
                json=payload,
            )
            response.raise_for_status()
            data = response.json()

        run_id = data.get("run_id") or data.get("id")
        if not run_id:
            raise RuntimeError(f"TinyFish run_id missing in response: {data}")

        await self.log_step(task, "run_async_started", {"run_id": run_id})

        # Fetch streaming URL from run details
        streaming_url = None
        try:
            async with httpx.AsyncClient(timeout=15.0) as detail_client:
                detail_resp = await detail_client.get(
                    f"https://agent.tinyfish.ai/v1/runs/{run_id}",
                    headers=headers,
                )
                if detail_resp.status_code == 200:
                    run_data = detail_resp.json()
                    streaming_url = run_data.get("streamingUrl")
        except Exception as exc:
            self.logger.warning("Could not fetch streaming URL: %s", exc)

        # Persist run_id + streaming_url on the task
        task.tinyfish_run_id = str(run_id)
        task.streaming_url = streaming_url
        await task.save()

        await self.log_step(task, "streaming_url_captured", {
            "streaming_url": streaming_url,
        })
        await self._append_progress(task, "Agent run started")

        return str(run_id)

    async def _poll_run(self, task: Task, run_id: str) -> dict[str, Any]:
        headers = {
            "Authorization": f"Bearer {self.settings.TINYFISH_API_KEY}",
            "Content-Type": "application/json",
        }

        progress_messages = [
            "Agent navigating portal...",
            "Loading payer website...",
            "Entering patient information...",
            "Submitting request details...",
            "Processing payer response...",
            "Waiting for portal confirmation...",
        ]

        async with httpx.AsyncClient(timeout=60.0) as client:
            for attempt in range(1, 61):
                await self.log_step(
                    task,
                    "poll_attempt",
                    {"attempt": attempt, "run_id": run_id},
                )

                # Append contextual progress message
                if attempt <= len(progress_messages):
                    msg = progress_messages[attempt - 1]
                else:
                    msg = f"Checking run status... attempt {attempt}"
                await self._append_progress(task, msg)

                resp = await client.get(f"{self.base_url}/v1/runs/{run_id}", headers=headers)
                resp.raise_for_status()
                body = resp.json()
                run_status = str(body.get("status", "")).upper()

                await self.log_step(task, "poll_status", {"status": run_status})

                # Update streaming_url if it appeared after start
                if not task.streaming_url and body.get("streamingUrl"):
                    task.streaming_url = body["streamingUrl"]
                    await task.save()

                if run_status == "COMPLETED":
                    await self._append_progress(task, "Agent completed successfully")
                    await self.log_step(task, "run_completed", {"run_id": run_id})
                    return self._extract_result_payload(body)

                if run_status in {"FAILED", "CANCELLED", "CANCELED"}:
                    err = body.get("error") or body.get("message") or "Unknown TinyFish run failure"
                    await self._append_progress(task, f"Agent run {run_status.lower()}: {err}")
                    raise RuntimeError(f"TinyFish run {run_status}: {err}")

                await asyncio.sleep(5)

        await self._append_progress(task, "Agent run timed out")
        raise TimeoutError("TinyFish run timed out after 60 polling attempts")

    @staticmethod
    def _extract_result_payload(run_body: dict[str, Any]) -> dict[str, Any]:
        candidates = [
            run_body.get("result"),
            run_body.get("output"),
            run_body.get("data"),
            run_body.get("response"),
        ]

        for item in candidates:
            if isinstance(item, dict):
                return item
            if isinstance(item, str):
                try:
                    parsed = json.loads(item)
                    if isinstance(parsed, dict):
                        return parsed
                except Exception:
                    continue

        # Fallback to full payload for parser normalization
        return run_body
