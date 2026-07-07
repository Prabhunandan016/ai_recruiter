"""Scoring modules."""

from __future__ import annotations

import re
from dataclasses import dataclass


@dataclass
class ScoreBreakdown:
    semantic_score: float = 0.0
    skill_score: float = 0.0
    career_score: float = 0.0
    behavior_score: float = 0.0
    education_score: float = 0.0
    project_score: float = 0.0
    qualification_score: float = 0.0
    additional_req_score: float = 0.0
    penalty_score: float = 0.0
    final_score: float = 0.0


class SemanticScorer:
    @staticmethod
    def score(query_embedding, candidate_embedding) -> float:
        import numpy as np
        q = query_embedding / (np.linalg.norm(query_embedding) + 1e-8)
        c = candidate_embedding / (np.linalg.norm(candidate_embedding) + 1e-8)
        return max(0.0, min(1.0, float(np.dot(q, c))))


class SkillScorer:
    # Skills that are substrings of other skills — must use exact word boundary matching
    AMBIGUOUS = {"java", "go", "r", "c", "rust", "scala", "swift", "c#"}

    @staticmethod
    def _skill_in_text(skill: str, text: str) -> bool:
        """Check skill presence using word boundaries to avoid false substring matches."""
        # Always use word boundary regex for reliable matching
        pattern = r'(?<![\w.#])' + re.escape(skill) + r'(?![\w.#])'
        return bool(re.search(pattern, text, re.IGNORECASE))

    @staticmethod
    def _skills_match(req: str, cand: str) -> bool:
        """Check if two skill strings refer to the same skill."""
        # Exact match
        if req == cand:
            return True
        # Known aliases: javascript == js, typescript == ts, nodejs == node.js, etc.
        ALIASES = {
            "javascript": ["js"], "typescript": ["ts"],
            "nodejs": ["node.js", "node"], "nextjs": ["next.js"],
            "reactjs": ["react", "react.js"], "vuejs": ["vue", "vue.js"],
            "postgres": ["postgresql"], "mongo": ["mongodb"],
            "ml": ["machine learning"], "ai": ["artificial intelligence"],
        }
        for canonical, aliases in ALIASES.items():
            group = {canonical} | set(aliases)
            if req in group and cand in group:
                return True
        # Safe substring: only if the shorter one is a full word within the longer
        # e.g. "react" inside "react.js" is fine, but NOT "java" inside "javascript"
        if len(req) != len(cand):
            longer, shorter = (req, cand) if len(req) > len(cand) else (cand, req)
            pattern = r'(?<![\w.])' + re.escape(shorter) + r'(?![\w.])'  
            if re.search(pattern, longer):
                # Extra guard: don't match java→javascript, c→c++, go→golang
                BLOCKED = [("java", "javascript"), ("c", "c++"), ("c", "c#"),
                           ("go", "golang"), ("r", "rust"), ("r", "react")]
                for a, b in BLOCKED:
                    if {shorter, longer} == {a, b}:
                        return False
                return True
        return False

    @staticmethod
    def score(required_skills: list[str], candidate_skills: list[str], resume_text: str = "") -> tuple[float, list[str], list[str]]:
        """Returns (score, matched_skills, missing_skills).
        Also checks raw resume text directly for skills not caught by the extractor.
        """
        if not required_skills:
            return 0.5, [], []
        req = [s.lower().strip() for s in required_skills]
        cand = [s.lower().strip() for s in candidate_skills]
        text_lower = resume_text.lower()
        matched, missing = [], []
        for r in req:
            # Check extracted skills list first
            skill_in_list = any(SkillScorer._skills_match(r, c) for c in cand)
            # Also check directly in raw text with word boundary
            skill_in_text = bool(re.search(
                r'(?<![\w.#])' + re.escape(r) + r'(?![\w.#])', text_lower
            )) if text_lower else False
            if skill_in_list or skill_in_text:
                matched.append(r)
            else:
                missing.append(r)
        return min(1.0, len(matched) / len(req)), matched, missing


class CareerScorer:
    @staticmethod
    def score(experience_years: float, exp_min: float = 0.0, exp_max: float = 5.0) -> float:
        """
        Score based on actual vs required experience range.
        - 0 exp when min=0 (fresher role): neutral 0.7
        - 0 exp when min>0: very low score
        - Within range: full score
        - Slightly over: still good (seniority acceptable)
        - Heavily over: mild penalty (overqualified risk)
        """
        # Fresher applying to fresher role
        if experience_years <= 0 and exp_min <= 0:
            return 0.7

        # No experience but role requires some
        if experience_years <= 0 and exp_min > 0:
            return 0.05

        # Under-experienced
        if experience_years < exp_min:
            ratio = experience_years / max(exp_min, 0.1)
            return max(0.05, round(ratio * 0.75, 3))

        # Within range — perfect
        if experience_years <= exp_max:
            return 1.0

        # Overqualified (beyond max)
        over = experience_years - exp_max
        return max(0.55, round(1.0 - over * 0.06, 3))


class BehaviorScorer:
    LEADERSHIP = ["led", "managed", "mentored", "supervised", "directed", "spearheaded", "oversaw", "guided", "coached"]
    COLLABORATION = ["collaborated", "partnered", "coordinated", "liaised", "worked with", "cross-functional", "team"]
    DELIVERY = ["delivered", "launched", "shipped", "deployed", "released", "completed", "achieved", "implemented"]
    INITIATIVE = ["initiated", "proposed", "designed", "architected", "created", "built", "established", "introduced"]
    COMMUNICATION = ["presented", "documented", "wrote", "communicated", "reported", "published", "authored"]
    PROBLEM_SOLVING = ["resolved", "debugged", "optimized", "improved", "reduced", "increased", "fixed", "diagnosed"]
    OWNERSHIP = ["owned", "responsible", "accountability", "end-to-end", "maintained", "ownership"]

    ALL_SIGNALS = {
        "leadership": LEADERSHIP, "collaboration": COLLABORATION,
        "delivery": DELIVERY, "initiative": INITIATIVE,
        "communication": COMMUNICATION, "problem_solving": PROBLEM_SOLVING,
        "ownership": OWNERSHIP,
    }

    @staticmethod
    def score(resume_text: str, behavioral_requirements: list[str]) -> float:
        text_lower = resume_text.lower()
        dimension_hits = sum(
            1 for signals in BehaviorScorer.ALL_SIGNALS.values()
            if any(sig in text_lower for sig in signals)
        )
        dimension_score = dimension_hits / len(BehaviorScorer.ALL_SIGNALS)
        if behavioral_requirements:
            req_score = sum(1 for r in behavioral_requirements if r.lower() in text_lower) / len(behavioral_requirements)
            return min(1.0, 0.5 * dimension_score + 0.5 * req_score)
        return min(1.0, dimension_score)


class EducationScorer:
    DEGREE_TIERS = {
        "phd": 1.0, "ph.d": 1.0, "doctorate": 1.0,
        "master": 0.9, "m.s": 0.9, "m.tech": 0.9, "mca": 0.85, "mba": 0.85,
        "bachelor": 0.75, "b.tech": 0.75, "b.e": 0.75, "be": 0.75, "bca": 0.7,
        "diploma": 0.5, "certification": 0.55,
    }
    PRESTIGE_KEYWORDS = ["iit", "nit", "iiit", "bits", "mit", "stanford", "oxford", "cambridge"]

    @staticmethod
    def score(education_list: list[str], gap_info: dict) -> float:
        if not education_list:
            return 0.4
        combined = " ".join(education_list).lower()
        degree_score = 0.5
        for keyword, tier in EducationScorer.DEGREE_TIERS.items():
            if keyword in combined:
                degree_score = max(degree_score, tier)
        prestige_bonus = 0.05 if any(kw in combined for kw in EducationScorer.PRESTIGE_KEYWORDS) else 0.0
        base = min(1.0, degree_score + prestige_bonus)
        if gap_info.get("has_gap"):
            penalty = min(0.20, gap_info.get("gap_years", 0) * 0.05)
            base = max(0.2, base - penalty)
        return round(base, 3)


class QualificationScorer:
    """Score qualification match: required degree tiers vs candidate's degree."""

    DEGREE_ORDER = ["diploma", "bca", "b.tech", "be", "bachelor", "mca", "mba", "m.tech", "master", "phd"]

    @staticmethod
    def _tier(qual: str) -> int:
        q = qual.lower()
        for i, d in enumerate(QualificationScorer.DEGREE_ORDER):
            if d in q:
                return i
        return -1

    @staticmethod
    def score(required_qualifications: list[str], candidate_qualification: str, candidate_stream: str, required_streams: list[str]) -> float:
        score = 0.5  # default if no requirements set

        # Qualification match
        if required_qualifications and candidate_qualification:
            req_tiers = [QualificationScorer._tier(q) for q in required_qualifications]
            cand_tier = QualificationScorer._tier(candidate_qualification)
            if cand_tier >= 0:
                max_req = max(req_tiers) if req_tiers else 0
                if cand_tier >= max_req:
                    score = 1.0
                elif cand_tier == max_req - 1:
                    score = 0.7  # one tier below required
                else:
                    score = 0.4  # significantly under-qualified
            else:
                score = 0.5

        # Stream match bonus
        if required_streams and candidate_stream:
            stream_lower = candidate_stream.lower()
            if any(s.lower() in stream_lower or stream_lower in s.lower() for s in required_streams):
                score = min(1.0, score + 0.15)

        return round(score, 3)


class ProjectRelevanceScorer:
    """Score how relevant candidate's projects are to the job."""

    @staticmethod
    def score(projects: list[str], job_description: str, required_skills: list[str]) -> float:
        if not projects:
            return 0.25  # no projects — mild penalty

        jd_lower = job_description.lower()
        skills_lower = [s.lower() for s in required_skills]
        project_text = " ".join(projects).lower()

        # Skill hits in project text using word-boundary matching
        skill_hits = sum(
            1 for s in skills_lower
            if re.search(r'(?<![\w.#])' + re.escape(s) + r'(?![\w.#])', project_text)
        )
        skill_score = min(1.0, skill_hits / max(len(skills_lower), 1))

        # JD keyword overlap with projects
        stop = {"with", "that", "this", "have", "will", "from", "your",
                "they", "their", "work", "team", "able", "good", "must", "also"}
        jd_words = {w for w in re.findall(r'\b[a-z]{4,}\b', jd_lower) if w not in stop}
        jd_hits = sum(1 for w in jd_words if w in project_text)
        jd_score = min(1.0, jd_hits / max(len(jd_words), 1) * 6)

        return round(min(1.0, 0.6 * skill_score + 0.4 * jd_score), 3)


class AdditionalRequirementsScorer:
    """Score match against recruiter's freeform additional requirements."""

    @staticmethod
    def score(resume_text: str, additional_requirements: str) -> float:
        if not additional_requirements or not additional_requirements.strip():
            return 1.0  # no extra requirements — full score

        import re
        req_words = set(re.findall(r'\b[a-z]{3,}\b', additional_requirements.lower())) - {
            "the", "and", "for", "with", "that", "should", "must", "will", "have", "any"
        }
        if not req_words:
            return 1.0

        text_lower = resume_text.lower()
        matches = sum(1 for w in req_words if w in text_lower)
        return round(min(1.0, matches / len(req_words)), 3)


class FinalScorer:
    @staticmethod
    def score(
        semantic_score: float,
        skill_score: float,
        career_score: float,
        behavior_score: float,
        education_score: float,
        project_score: float,
        qualification_score: float,
        additional_req_score: float,
        penalty_score: float,
    ) -> float:
        final = (
            0.25 * semantic_score
            + 0.20 * skill_score
            + 0.15 * career_score
            + 0.10 * education_score
            + 0.10 * qualification_score
            + 0.10 * project_score
            + 0.05 * behavior_score
            + 0.05 * additional_req_score
            - penalty_score
        )
        return max(0.0, min(1.0, final))
