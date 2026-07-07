"""Recruiter service."""

from __future__ import annotations

from datetime import datetime

from bson import ObjectId

from src.database.mongodb.connection import get_db
from src.database.mongodb.models import Job, JobStatus
from src.utils.logger import get_logger

LOGGER = get_logger(__name__)


def _serialize_job(job: dict) -> dict:
    """Convert MongoDB job document to serializable dict."""
    job["_id"] = str(job["_id"])
    if "created_at" in job:
        job["created_at"] = job["created_at"].isoformat()
    if "updated_at" in job:
        job["updated_at"] = job["updated_at"].isoformat()
    return job


class RecruiterService:
    """Manage recruiter operations."""

    @staticmethod
    def create_job(
        recruiter_id: str, title: str, company: str,
        job_description: str, required_skills: list[str],
        preferred_skills: list[str], behavioral_requirements: list[str],
        company_location: str = "", work_location: str = "on-site",
        job_type: str = "full-time", required_qualifications: list[str] = None,
        required_streams: list[str] = None, exp_min: float = 0.0,
        exp_max: float = 5.0, additional_requirements: str = "",
    ) -> dict[str, str]:
        """Create a new job posting."""
        db = get_db()
        job = Job(
            recruiter_id=recruiter_id, title=title, company=company,
            company_location=company_location, work_location=work_location,
            job_type=job_type,
            required_qualifications=required_qualifications or [],
            required_streams=required_streams or [],
            exp_min=exp_min, exp_max=exp_max,
            job_description=job_description,
            required_skills=required_skills, preferred_skills=preferred_skills,
            behavioral_requirements=behavioral_requirements,
            additional_requirements=additional_requirements,
        )
        result = db.jobs.insert_one(job.to_dict())
        job_id = str(result.inserted_id)
        LOGGER.info(f"Job created: {title} by {recruiter_id}")
        return {"job_id": job_id, "title": title, "status": JobStatus.ACTIVE.value}

    @staticmethod
    def get_recruiter_jobs(recruiter_id: str) -> list[dict]:
        """Get recruiter's jobs with applicant counts in a single aggregation query."""
        db = get_db()
        pipeline = [
            {"$match": {"recruiter_id": recruiter_id}},
            {"$sort": {"created_at": -1}},
            {"$addFields": {"job_id_str": {"$toString": "$_id"}}},
            {"$lookup": {
                "from": "applications",
                "localField": "job_id_str",
                "foreignField": "job_id",
                "as": "_applicants",
            }},
            {"$addFields": {"applicant_count": {"$size": "$_applicants"}}},
            {"$project": {"_applicants": 0, "job_id_str": 0}},
        ]
        jobs = list(db.jobs.aggregate(pipeline))
        for job in jobs:
            job["_id"] = str(job["_id"])
            if "created_at" in job:
                job["created_at"] = job["created_at"].isoformat()
            if "updated_at" in job:
                job["updated_at"] = job["updated_at"].isoformat()
        return jobs

    @staticmethod
    def get_job_by_id(job_id: str) -> dict | None:
        """Get job by ID."""
        db = get_db()
        try:
            job = db.jobs.find_one({"_id": ObjectId(job_id)})
        except Exception:
            return None
        if not job:
            return None
        return _serialize_job(job)

    @staticmethod
    def update_job_status(job_id: str, status: str) -> dict:
        """Update job status (active/closed/draft)."""
        db = get_db()
        db.jobs.update_one(
            {"_id": ObjectId(job_id)},
            {"$set": {"status": status, "updated_at": datetime.utcnow()}},
        )
        LOGGER.info(f"Job {job_id} status updated to {status}")
        return {"job_id": job_id, "status": status}

    @staticmethod
    def get_job_applicants(job_id: str) -> list[dict]:
        """Get applicants for a job."""
        db = get_db()
        applicants = list(db.applications.find({"job_id": job_id}).sort("applied_at", -1))
        for app in applicants:
            app["_id"] = str(app["_id"])
            if "applied_at" in app:
                app["applied_at"] = app["applied_at"].isoformat()
            if "updated_at" in app:
                app["updated_at"] = app["updated_at"].isoformat()
        return applicants

    @staticmethod
    def update_application_status(application_id: str, status: str) -> dict:
        """Update application status."""
        db = get_db()
        db.applications.update_one(
            {"_id": ObjectId(application_id)},
            {"$set": {"status": status, "updated_at": datetime.utcnow()}},
        )
        return {"application_id": application_id, "status": status}
