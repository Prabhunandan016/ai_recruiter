"""Buzzword overload detector."""

from __future__ import annotations


class BuzzwordDetector:
    """Detect overload of buzzwords."""

    BUZZWORDS = {
        "leverage",
        "synergy",
        "paradigm",
        "ecosystem",
        "disruptive",
        "game-changer",
        "circle back",
        "bandwidth",
    }

    @staticmethod
    def score(resume_text: str) -> float:
        """Compute penalty for buzzword overload."""
        text_lower = resume_text.lower()
        
        buzzword_hits = sum(1 for bw in BuzzwordDetector.BUZZWORDS if bw in text_lower)
        if buzzword_hits == 0:
            return 0.0
        
        penalty = min(0.2, buzzword_hits * 0.03)
        return penalty
