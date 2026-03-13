"""
Celery tasks — background execution of agent workflows.
"""

import asyncio
import logging
from datetime import datetime

from beanie import init_beanie
from motor.motor_asyncio import AsyncIOMotorClient

from app.config import get_settings
from app.models.task import Task
from app.models.user import User
from app.models.patient import Patient
from app.models.claim import Claim
from app.services.agent_service import AgentService
from app.services.mail_service import mail_service
from app.workers.celery_app import celery_app

logger = logging.getLogger(__name__)


async def _init_beanie() -> AsyncIOMotorClient:
    """Initialise a fresh Beanie/Motor connection for the worker process."""
    settings = get_settings()
    client = AsyncIOMotorClient(settings.MONGO_URI)
    db = client.get_default_database()
    await init_beanie(database=db, document_models=[User, Patient, Task, Claim])
    return client


async def _run_agent_task(task_id: str) -> None:
    """Async implementation of the agent task."""
    client = await _init_beanie()
    try:
        task = await Task.get(task_id)
        if task is None:
            logger.error("Task %s not found", task_id)
            return

        # Mark as in-progress
        task.status = "in_progress"
        task.updated_at = datetime.utcnow()
        await task.save()

        # Execute the agent
        agent_service = AgentService()
        result = await agent_service.execute(task)

        # Reload task in case agent_service mutated it (agent_trace etc.)
        task = await Task.get(task_id)

        # On success: status may still require human review based on parsed result
        next_status = (result or {}).get("task_status") or "completed"
        task.status = next_status
        task.result = result
        if result and result.get("auth_number"):
            task.auth_number = result["auth_number"]
        if next_status == "completed":
            task.completed_at = datetime.utcnow()
        else:
            task.failure_reason = result.get("requires_action") or result.get("payer_response")
        task.updated_at = datetime.utcnow()
        await task.save()

        logger.info("Task %s finished with status=%s", task_id, task.status)

        # ── Email notification ───────────────────────────────────
        try:
            user = await User.find_one(User.id == task.practice_id)  # type: ignore[arg-type]
            if user:
                if task.status == "completed":
                    await mail_service.notify_task_completed(
                        to_email=user.email,
                        patient_name=task.patient_name or "Unknown Patient",
                        task_type=task.task_type,
                        payer=task.payer,
                        result=task.result or {},
                        task_id=str(task.id),
                    )
                elif task.status in ("failed", "requires_human"):
                    await mail_service.notify_task_failed(
                        to_email=user.email,
                        patient_name=task.patient_name or "Unknown Patient",
                        task_type=task.task_type,
                        payer=task.payer,
                        failure_reason=task.failure_reason or "",
                        task_id=str(task.id),
                    )
        except Exception:
            logger.exception("Email notification failed for task %s (non-fatal)", task_id)

    except Exception as exc:
        logger.exception("Task %s failed: %s", task_id, exc)
        # Prefer manual review over failed for sensitive healthcare workflows
        try:
            task = await Task.get(task_id)
            if task:
                task.status = "requires_human"
                task.failure_reason = str(exc)
                task.updated_at = datetime.utcnow()
                await task.save()

                # Notify practice user of failure
                try:
                    user = await User.find_one(User.id == task.practice_id)  # type: ignore[arg-type]
                    if user:
                        await mail_service.notify_task_failed(
                            to_email=user.email,
                            patient_name=task.patient_name or "Unknown Patient",
                            task_type=task.task_type,
                            payer=task.payer,
                            failure_reason=task.failure_reason or "",
                            task_id=str(task.id),
                        )
                except Exception:
                    logger.exception("Failure email failed for task %s (non-fatal)", task_id)
        except Exception:
            logger.exception("Could not update task %s after failure", task_id)
    finally:
        client.close()


@celery_app.task(name="run_agent_task", bind=True, max_retries=2)
def run_agent_task(self, task_id: str) -> dict:
    """Celery task: fetch a Task document, run the appropriate agent, save results."""
    try:
        asyncio.run(_run_agent_task(task_id))
        return {"task_id": task_id, "status": "done"}
    except Exception as exc:
        logger.exception("run_agent_task failed for %s", task_id)
        raise self.retry(exc=exc, countdown=10)


# ── Daily summary beat task ──────────────────────────────────────────

@celery_app.task(name="send_daily_summaries")
def send_daily_summaries() -> dict:
    """Runs daily at 7 AM via Celery Beat — sends summary to all active practices."""

    async def _send() -> int:
        client = await _init_beanie()
        sent = 0
        try:
            users = await User.find(User.is_active == True).to_list()  # noqa: E712
            for user in users:
                total = await Task.find(
                    Task.practice_id == str(user.id)
                ).count()
                completed = await Task.find(
                    Task.practice_id == str(user.id),
                    Task.status == "completed",
                ).count()
                requires_human = await Task.find(
                    Task.practice_id == str(user.id),
                    Task.status == "requires_human",
                ).count()

                ok = await mail_service.notify_daily_summary(
                    to_email=user.email,
                    practice_name=user.practice_name,
                    stats={
                        "total": total,
                        "completed": completed,
                        "requires_human": requires_human,
                    },
                )
                if ok:
                    sent += 1
        finally:
            client.close()
        return sent

    count = asyncio.run(_send())
    logger.info("Daily summaries sent to %d users", count)
    return {"sent": count}
