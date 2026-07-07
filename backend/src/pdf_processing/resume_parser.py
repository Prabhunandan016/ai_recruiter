"""Structured data extraction from resume text."""

from __future__ import annotations

import re
from datetime import datetime

from src.utils.logger import get_logger

LOGGER = get_logger(__name__)

MONTH_MAP = {
    "jan": 1, "feb": 2, "mar": 3, "apr": 4, "may": 5, "jun": 6,
    "jul": 7, "aug": 8, "sep": 9, "oct": 10, "nov": 11, "dec": 12,
    "january": 1, "february": 2, "march": 3, "april": 4, "june": 6,
    "july": 7, "august": 8, "september": 9, "october": 10,
    "november": 11, "december": 12,
}

# Section headers that indicate WORK EXPERIENCE sections
EXPERIENCE_SECTION_HEADERS = re.compile(
    r"(work\s+experience|professional\s+experience|employment(\s+history)?|"
    r"experience|internship|intern\s+experience|positions?\s+held|career\s+history)",
    re.IGNORECASE,
)

# Section headers that are NOT work experience (to stop extraction)
NON_EXPERIENCE_HEADERS = re.compile(
    r"(education|academic|projects?|skills?|certifications?|achievements?|"
    r"awards?|publications?|languages?|hobbies|interests|references?|summary|objective)",
    re.IGNORECASE,
)


def _parse_year_month(text: str) -> tuple[int, int] | None:
    text = text.strip().lower()
    m = re.match(r"([a-z]+)\s+(\d{4})", text)
    if m:
        month = MONTH_MAP.get(m.group(1)[:3])
        if month:
            return int(m.group(2)), month
    m = re.match(r"(\d{4})$", text)
    if m:
        return int(m.group(1)), 6
    return None


def _months_between(start: tuple[int, int], end: tuple[int, int]) -> float:
    return (end[0] - start[0]) * 12 + (end[1] - start[1])


def _extract_experience_section(text: str) -> str:
    """Extract only the work experience section from resume text."""
    lines = text.split("\n")
    in_experience = False
    experience_lines = []

    for line in lines:
        stripped = line.strip()
        if not stripped:
            if in_experience:
                experience_lines.append("")
            continue

        # Check if this is an experience section header
        if EXPERIENCE_SECTION_HEADERS.match(stripped) and len(stripped) < 60:
            in_experience = True
            continue

        # Check if we hit a different section header — stop collecting
        if in_experience and NON_EXPERIENCE_HEADERS.match(stripped) and len(stripped) < 60:
            break

        if in_experience:
            experience_lines.append(line)

    return "\n".join(experience_lines)


class ResumeExtractor:
    """Extract structured information from resume text."""

    SKILL_KEYWORDS = {
        "programming": [
            "python", "javascript", "java", "c++", "golang", "rust",
            "typescript", "c#", "php", "swift", "kotlin", "scala", "ruby",
        ],
        "frameworks": [
            "fastapi", "django", "flask", "react", "vue", "angular", "spring",
            "express", "nextjs", "nodejs", "laravel", "rails", "nestjs",
        ],
        "databases": [
            "mongodb", "postgresql", "mysql", "redis", "elasticsearch",
            "cassandra", "sqlite", "dynamodb", "firebase", "oracle",
        ],
        "tools": [
            "docker", "kubernetes", "git", "jenkins", "terraform", "aws",
            "gcp", "azure", "linux", "bash", "ci/cd", "github actions",
        ],
        "ml": [
            "machine learning", "deep learning", "nlp", "computer vision",
            "tensorflow", "pytorch", "scikit-learn", "pandas", "numpy", "keras",
        ],
    }

    @staticmethod
    def _match_skill(keyword: str, text: str) -> bool:
        """Word-boundary match to prevent java->javascript false positives."""
        if " " in keyword or "/" in keyword:
            return keyword in text
        pattern = r"(?<![\w.#])" + re.escape(keyword) + r"(?![\w.#])"
        return bool(re.search(pattern, text, re.IGNORECASE))

    @staticmethod
    def extract_skills(text: str) -> list[str]:
        skills = []
        text_lower = text.lower()
        for keywords in ResumeExtractor.SKILL_KEYWORDS.values():
            for keyword in keywords:
                if ResumeExtractor._match_skill(keyword, text_lower):
                    skills.append(keyword)
        return list(set(skills))

    @staticmethod
    def extract_education(text: str) -> list[str]:
        education = []
        patterns = [
            r"(bachelor|b\.s\.|b\.a\.|master|m\.s\.|m\.a\.|phd|ph\.d\.|b\.tech|m\.tech|b\.e|mca|bca|m\.e)[\w\s,.()/–-]{3,80}",
            r"(bs|ba|ms|ma)\s+(?:in|of)\s+\w[\w\s]{2,40}",
        ]
        for pattern in patterns:
            for match in re.finditer(pattern, text, re.IGNORECASE | re.MULTILINE):
                edu = match.group(0).strip()
                if 5 < len(edu) < 150:
                    education.append(edu)
        return list(dict.fromkeys(education))  # dedupe preserving order

    @staticmethod
    def extract_experience_years(text: str) -> float:
        """
        Accurately extract total work experience years.
        Strategy:
          1. If candidate explicitly states total experience → use that.
          2. Extract ONLY from the work experience section (not education dates).
          3. Sum non-overlapping date ranges found there.
          4. Return 0.0 if nothing found — never guess.
        """
        # 1. Explicit total experience statement
        explicit_patterns = [
            r"(\d+(?:\.\d+)?)\s*\+?\s*(?:years?|yrs?)[\s\w]{0,15}(?:of\s+)?(?:work\s+|professional\s+|industry\s+)?experience",
            r"total\s+experience\s*[:\-]?\s*(\d+(?:\.\d+)?)\s*(?:years?|yrs?)",
            r"experience\s*[:\-]\s*(\d+(?:\.\d+)?)\s*(?:years?|yrs?)",
        ]
        for pat in explicit_patterns:
            m = re.search(pat, text, re.IGNORECASE)
            if m:
                val = float(m.group(1))
                # Sanity check: ignore values > 50 years
                if 0 < val <= 50:
                    return val

        # 2. Extract from experience section only
        exp_section = _extract_experience_section(text)
        if not exp_section.strip():
            # Fallback: use full text but be more conservative
            exp_section = text

        date_range_re = re.compile(
            r"([A-Za-z]*\s*\d{4})\s*(?:–|—|-|to)\s*(present|current|now|till\s+date|[A-Za-z]*\s*\d{4})",
            re.IGNORECASE,
        )
        now = (datetime.now().year, datetime.now().month)
        intervals: list[tuple[tuple[int, int], tuple[int, int]]] = []

        for m in date_range_re.finditer(exp_section):
            start_str = m.group(1).strip()
            end_str = m.group(2).strip().lower()

            start = _parse_year_month(start_str)
            if not start:
                continue

            if re.match(r"present|current|now|till", end_str):
                end = now
            else:
                end = _parse_year_month(end_str)

            if not end:
                continue

            months = _months_between(start, end)
            # Sanity: between 1 month and 20 years per role
            if 1 <= months <= 240:
                intervals.append((start, end))

        if not intervals:
            return 0.0

        # Merge overlapping intervals to avoid double-counting
        intervals.sort(key=lambda x: x[0])
        merged: list[tuple[tuple[int, int], tuple[int, int]]] = [intervals[0]]
        for start, end in intervals[1:]:
            prev_start, prev_end = merged[-1]
            # Convert to months for comparison
            prev_end_months = prev_end[0] * 12 + prev_end[1]
            start_months = start[0] * 12 + start[1]
            if start_months <= prev_end_months:
                # Overlapping — extend if needed
                end_months = end[0] * 12 + end[1]
                if end_months > prev_end_months:
                    merged[-1] = (prev_start, end)
            else:
                merged.append((start, end))

        total_months = sum(_months_between(s, e) for s, e in merged)
        return round(total_months / 12, 1)

    @staticmethod
    def detect_education_gap(text: str) -> dict:
        """Detect unexplained gaps in education timeline."""
        # Only look at education section
        edu_section = _get_section(text, "education")
        search_text = edu_section if edu_section else text

        # Find year ranges specifically in education context
        edu_years = re.findall(
            r"(?:graduated?|batch|class\s+of|passout|passed\s+out|year\s+of\s+passing)[\s:]*(\d{4})",
            search_text, re.IGNORECASE,
        )
        # Also find degree year ranges
        range_years = re.findall(
            r"(?:b\.?tech|b\.?e|m\.?tech|mca|bca|bachelor|master)[\w\s,.()/]*(\d{4})\s*[-–]\s*(\d{4})",
            search_text, re.IGNORECASE,
        )

        years = [int(y) for y in edu_years if y.isdigit() and 1990 <= int(y) <= datetime.now().year]
        for start_yr, end_yr in range_years:
            for yr in (start_yr, end_yr):
                if yr.isdigit() and 1990 <= int(yr) <= datetime.now().year:
                    years.append(int(yr))

        if len(years) < 2:
            return {"has_gap": False, "gap_years": 0.0, "note": ""}

        years = sorted(set(years))
        span = years[-1] - years[0]
        # Normal education spans 3-4 years for UG, 2 for PG
        # Gap = time beyond expected study duration
        expected = 4
        gap = max(0.0, span - expected - 1)  # 1 year tolerance

        if gap >= 2:
            return {"has_gap": True, "gap_years": float(gap), "note": f"~{int(gap)}-year education gap detected"}
        return {"has_gap": False, "gap_years": 0.0, "note": ""}

    @staticmethod
    def extract_projects(text: str) -> list[str]:
        """
        Extract project descriptions from resume.
        Looks for: Projects section, bullet points with project names,
        and sentences describing built/developed/created things.
        """
        projects = []

        # 1. Extract projects section
        proj_section = _get_section(text, "project")
        if proj_section:
            # Extract bullet points or lines that look like project titles/descriptions
            lines = [l.strip() for l in proj_section.split("\n") if l.strip()]
            for line in lines[:10]:
                if len(line) > 15:
                    projects.append(line)

        # 2. Fallback: pattern-based extraction from full text
        if not projects:
            patterns = [
                r"(?:^|\n)\s*[•\-*]\s*(.{15,120})",  # bullet points
                r"(?:project|built|developed|created|implemented)\s*[:\-–]\s*([^\n]{10,120})",
                r"(?:project\s+(?:title|name|description))\s*[:\-]\s*([^\n]{5,100})",
            ]
            for pat in patterns:
                for m in re.finditer(pat, text, re.IGNORECASE | re.MULTILINE):
                    item = m.group(1).strip()
                    if len(item) > 15 and item not in projects:
                        projects.append(item)
                if len(projects) >= 5:
                    break

        return projects[:8]


def _get_section(text: str, section_keyword: str) -> str:
    """Extract a named section from resume text."""
    lines = text.split("\n")
    in_section = False
    section_lines = []

    section_re = re.compile(
        r"^" + re.escape(section_keyword), re.IGNORECASE
    )
    end_re = re.compile(
        r"^(experience|education|skills?|certifications?|awards?|"
        r"projects?|achievements?|summary|objective|references?|languages?|work)",
        re.IGNORECASE,
    )

    for line in lines:
        stripped = line.strip()
        if not stripped:
            if in_section:
                section_lines.append("")
            continue

        if section_re.match(stripped) and len(stripped) < 60:
            in_section = True
            continue

        if in_section and end_re.match(stripped) and len(stripped) < 60:
            # Make sure it's not the same section
            if not section_re.match(stripped):
                break

        if in_section:
            section_lines.append(line)

    return "\n".join(section_lines)
