"""
BaseAgent — abstract base class for all ClearClaim agents.
"""

import logging
from abc import ABC, abstractmethod
from datetime import datetime
from typing import Any

from app.models.task import Task


class BaseAgent(ABC):
    """Abstract base for every agent implementation."""

    def __init__(self) -> None:
        self.logger = logging.getLogger(self.__class__.__name__)

    # ── Core contract ───────────────────────────────────────────────

    @abstractmethod
    async def execute(self, task: Task) -> dict:
        """Run the agent logic and return a result dict."""
        ...

    # ── Helpers ─────────────────────────────────────────────────────

    async def log_step(self, task: Task, step: str, data: dict[str, Any] | None = None) -> None:
        """Append a step entry to the task's agent_trace list and persist."""
        entry = {
            "step": step,
            "timestamp": datetime.utcnow().isoformat(),
            "data": data or {},
        }
        if task.agent_trace is None:
            task.agent_trace = []
        task.agent_trace.append(entry)
        await task.save()
        self.logger.info("[%s] %s – %s", task.id, step, data)
