"""Groq LLM client for reasoning generation."""

from __future__ import annotations

from groq import Groq

from src.config import get_settings
from src.utils.logger import get_logger

LOGGER = get_logger(__name__)


class GroqClient:
    """Groq API client for LLM calls."""

    def __init__(self) -> None:
        self.settings = get_settings()
        self._client: Groq | None = None

    @property
    def client(self) -> Groq:
        if self._client is None:
            if not self.settings.groq_api_key:
                raise RuntimeError("GROQ_API_KEY not configured")
            self._client = Groq(api_key=self.settings.groq_api_key)
        return self._client

    def generate_reasoning(
        self,
        candidate_name: str,
        scores: dict[str, float],
        penalties: list[str],
    ) -> str:
        """Generate factual, grounded reasoning. Never invent facts not in scores."""
        skill_pct = int(scores.get("skill_score", 0) * 100)
        career_pct = int(scores.get("career_score", 0) * 100)
        edu_pct = int(scores.get("education_score", 0) * 100)
        project_pct = int(scores.get("project_score", 0) * 100)
        semantic_pct = int(scores.get("semantic_score", 0) * 100)
        exp_years = scores.get("experience_years", 0)
        exp_min = scores.get("exp_min", 0)
        exp_max = scores.get("exp_max", 5)
        matched = scores.get("matched_skills", [])
        missing = scores.get("missing_skills", [])

        # Build factual context string
        exp_note = (
            f"Candidate has {exp_years} years of experience; role requires {exp_min}–{exp_max} years."
            if exp_years > 0
            else f"No work experience detected in resume; role requires {exp_min}–{exp_max} years."
        )
        matched_str = ", ".join(matched[:5]) if matched else "none"
        missing_str = ", ".join(missing[:5]) if missing else "none"
        penalty_str = f"Flags: {', '.join(penalties)}." if penalties else ""

        prompt = (
            "You are a strict technical recruiter writing a candidate evaluation. "
            "Write EXACTLY 2 sentences. Use ONLY the facts provided below — do NOT invent, "
            "assume, or infer anything not stated. If experience is 0, say so explicitly.\n\n"
            f"Candidate: {candidate_name}\n"
            f"- {exp_note}\n"
            f"- Skill match: {skill_pct}% | Matched: {matched_str} | Missing: {missing_str}\n"
            f"- Education score: {edu_pct}% | Project relevance: {project_pct}% | Semantic fit: {semantic_pct}%\n"
            f"- Career score: {career_pct}%\n"
            f"{penalty_str}\n\n"
            "Write 2 factual sentences now:"
        )

        try:
            response = self.client.chat.completions.create(
                model=self.settings.llm_model,
                messages=[{"role": "user", "content": prompt}],
                max_tokens=100,
                temperature=0.1,  # very low temperature = factual, no creativity
            )
            return response.choices[0].message.content.strip()
        except Exception as exc:
            LOGGER.warning(f"LLM call failed: {exc}")
            return self._fallback_reason(
                skill_pct, career_pct, edu_pct, exp_years, exp_min, exp_max,
                matched, missing, penalties,
            )

    @staticmethod
    def _fallback_reason(
        skill_pct: int, career_pct: int, edu_pct: int,
        exp_years: float, exp_min: float, exp_max: float,
        matched: list, missing: list, penalties: list,
    ) -> str:
        """Rule-based fallback that only states confirmed facts."""
        parts = []

        # Skill fact
        if matched:
            parts.append(f"Matched {len(matched)} required skill(s): {', '.join(matched[:3])}")
        else:
            parts.append("No required skills matched")

        if missing:
            parts.append(f"missing: {', '.join(missing[:3])}")

        sentence1 = "; ".join(parts) + "."

        # Experience fact
        if exp_years > 0:
            if career_pct >= 90:
                sentence2 = f"Experience ({exp_years}y) fits the required {exp_min}–{exp_max}y range."
            elif exp_years < exp_min:
                sentence2 = f"Under-experienced: has {exp_years}y but role needs {exp_min}–{exp_max}y."
            else:
                sentence2 = f"Overqualified: has {exp_years}y vs required {exp_min}–{exp_max}y."
        else:
            sentence2 = f"No work experience detected in resume; role requires {exp_min}–{exp_max} years."

        result = f"{sentence1} {sentence2}"
        if penalties:
            result += f" Flags: {', '.join(penalties)}."
        return result
