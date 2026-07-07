"""Reasoning generator."""

from __future__ import annotations

from src.llm.groq_client import GroqClient
from src.utils.logger import get_logger

LOGGER = get_logger(__name__)


class ReasoningGenerator:
    """Generate reasoning for ranking decisions."""

    def __init__(self) -> None:
        """Initialize reasoning generator."""
        self.groq = GroqClient()

    def generate(
        self,
        candidate_name: str,
        scores: dict[str, float],
        penalties: list[str],
    ) -> str:
        """Generate reasoning for a candidate."""
        try:
            reasoning = self.groq.generate_reasoning(candidate_name, scores, penalties)
            return reasoning
        except Exception as exc:
            LOGGER.warning(f"Failed to generate reasoning: {exc}")
            return "Candidate ranked by AI system"
