"""Services-only detector."""

from __future__ import annotations


class ServicesOnlyDetector:
    """Detect if candidate is services-only when product role required."""

    SERVICE_KEYWORDS = {
        "consulting",
        "support",
        "testing",
        "qa",
        "manual testing",
        "maintenance",
    }

    PRODUCT_KEYWORDS = {
        "product",
        "engineering",
        "platform",
        "backend",
        "frontend",
        "fullstack",
    }

    @staticmethod
    def score(resume_text: str, job_description: str) -> float:
        """Compute penalty for services-only profile."""
        text_lower = resume_text.lower()
        job_lower = job_description.lower()
        
        is_product_role = any(kw in job_lower for kw in ServicesOnlyDetector.PRODUCT_KEYWORDS)
        if not is_product_role:
            return 0.0
        
        service_hits = sum(1 for kw in ServicesOnlyDetector.SERVICE_KEYWORDS if kw in text_lower)
        product_hits = sum(1 for kw in ServicesOnlyDetector.PRODUCT_KEYWORDS if kw in text_lower)
        
        if service_hits > 0 and product_hits == 0:
            return 0.3
        
        return 0.0
