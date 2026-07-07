"""Honeypot detector for suspicious profiles."""

from __future__ import annotations


class HoneypotDetector:
    """Detect suspicious or low-credibility profiles."""

    BUZZWORDS = {
        "ninja",
        "guru",
        "rockstar",
        "10x engineer",
        "world class",
        "visionary",
        "thought leader",
        "ninja developer",
    }

    @staticmethod
    def score(resume_text: str, skills_count: int = 0) -> float:
        """Compute penalty for suspicious profile."""
        text_lower = resume_text.lower()
        
        buzzword_hits = sum(1 for bw in HoneypotDetector.BUZZWORDS if bw in text_lower)
        penalty = min(0.3, buzzword_hits * 0.05)
        
        if skills_count > 30 and len(resume_text) < 500:
            penalty += 0.2
        
        return min(1.0, penalty)
