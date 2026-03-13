"""
AgentService — orchestrates agent execution for a task.
"""

import logging
from datetime import datetime

from app.agents.agent_factory import AgentFactory
from app.models.task import Task

logger = logging.getLogger(__name__)


class AgentService:
    """Thin orchestration layer between Celery tasks and agents."""

    async def execute(self, task: Task) -> dict:
        """Pick the right agent, run it, and return the result dict.

        On unhandled exceptions the task is marked *requires_human* and
        the error is re-raised so the Celery task layer can record it.
        """
        try:
            agent = AgentFactory.get_agent(task)
            result = await agent.execute(task)
            return result
        except Exception as exc:
            logger.exception("Agent execution failed for task %s: %s", task.id, exc)
            # Mark as requires_human so the dashboard surfaces it
            task.status = "requires_human"
            task.failure_reason = f"Agent error: {exc}"
            task.updated_at = datetime.utcnow()
            await task.save()
            raise
