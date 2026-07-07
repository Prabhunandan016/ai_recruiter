"""Keyword stuffing detector."""

from __future__ import annotations

from collections import Counter


class KeywordStuffingDetector:
    """Detect keyword stuffing in resume."""

    STOP_WORDS = {
        "the", "and", "a", "an", "in", "of", "to", "for", "with", "on", "at",
        "by", "from", "as", "is", "was", "are", "were", "be", "been", "have",
        "has", "had", "do", "did", "will", "would", "could", "should", "may",
        "i", "my", "me", "we", "our", "it", "its", "this", "that", "or", "not",
        "experience", "work", "team", "role", "using", "used", "also", "all",
    }

    @staticmethod
    def score(text: str) -> float:
        """Penalize only genuine skill-word stuffing, not normal resume language."""
        words = [w.strip(".,()[]") for w in text.lower().split()]
        words = [w for w in words if len(w) > 3 and w not in KeywordStuffingDetector.STOP_WORDS]
        if len(words) < 20:
            return 0.0

        word_counts = Counter(words)
        # Only flag words repeated more than 5 times
        stuffed = sum(count - 5 for count in word_counts.values() if count > 5)
        if stuffed == 0:
            return 0.0

        return min(0.15, stuffed / len(words))
