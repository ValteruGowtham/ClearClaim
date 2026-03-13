"""
AgentFactory — returns the appropriate agent for a given task.
"""

import logging
import os

from app.agents.base_agent import BaseAgent
from app.agents.mock_agent import MockAgent
from app.agents.tinyfish_agent import TinyFishAgent
from app.models.task import Task


logger = logging.getLogger(__name__)


class AgentFactory:
    """Factory that resolves the right agent for a task."""

    @staticmethod
    def get_agent(task: Task) -> BaseAgent:
        """Return the best available agent instance for *task*."""
        if os.getenv("TINYFISH_API_KEY"):
            return TinyFishAgent()

        logger.warning("TINYFISH_API_KEY not found, using MockAgent")
        return MockAgent()
