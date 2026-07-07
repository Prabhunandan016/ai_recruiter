"""Candidate service."""

from __future__ import annotations

from pathlib import Path

from bson import ObjectId

from src.database.mongodb.connection import get_db
from src.database.mongodb.models import Application, CandidateProfile
from src.database.chromadb.connection import get_chroma_client
from src.embeddings.service import EmbeddingService
from src.pdf_processing.extractor import extract_text_from_pdf, chunk_text
from src.pdf_processing.resume_parser import ResumeExtractor
from src.utils.logger import get_logger

LOGGER = get_logger(__name__)


class CandidateService:
    """Manage candidate operations."""

    @staticmethod
    def get_all_jobs() -> list[dict]:
        """Get all active jobs with only the fields needed for the job listing."""
        db = get_db()
        # Projection: exclude raw_text heavy fields we don't need in the list view
        projection = {
            "_id": 1, "title": 1, "company": 1, "company_location": 1,
            "work_location": 1, "job_type": 1, "exp_min": 1, "exp_max": 1,
            "required_skills": 1, "preferred_skills": 1, "required_qualifications": 1,
            "required_streams": 1, "job_description": 1, "status": 1,
            "created_at": 1, "updated_at": 1,
        }
        jobs = list(db.jobs.find({"status": "active"}, projection).sort("created_at", -1))
        for job in jobs:
            job["_id"] = str(job["_id"])
            if "created_at" in job:
                job["created_at"] = job["created_at"].isoformat()
            if "updated_at" in job:
                job["updated_at"] = job["updated_at"].isoformat()
        return jobs

    @staticmethod
    def apply_for_job(
        candidate_id: str, job_id: str, name: str, email: str, phone: str,
        resume_file_path: str, qualification: str = "", stream: str = "",
        total_experience: float = 0.0, year_of_passout: int = 0,
    ) -> dict[str, str]:
        """Process job application."""
        db = get_db()
        try:
            job = db.jobs.find_one({"_id": ObjectId(job_id), "status": "active"})
        except Exception:
            raise ValueError("Invalid job ID")
        if not job:
            raise ValueError("Job not found or no longer active")
        if db.applications.find_one({"candidate_id": candidate_id, "job_id": job_id}):
            raise ValueError("You have already applied for this job")

        # File is already saved by the route handler — use it directly
        resume_path = Path(resume_file_path)
        if not resume_path.exists():
            raise ValueError("Resume file not found")

        resume_text = extract_text_from_pdf(str(resume_path))
        if not resume_text.strip():
            raise ValueError("Could not extract text from resume. Ensure it is a text-based PDF.")

        extractor = ResumeExtractor()
        skills = extractor.extract_skills(resume_text)
        education = extractor.extract_education(resume_text)
        projects = extractor.extract_projects(resume_text)

        application = Application(
            candidate_id=candidate_id, job_id=job_id, name=name,
            email=email, phone=phone, resume_path=str(resume_path),
            qualification=qualification, stream=stream,
            total_experience=total_experience, year_of_passout=year_of_passout,
        )
        result = db.applications.insert_one(application.to_dict())

        profile = CandidateProfile(
            candidate_id=candidate_id, job_id=job_id, skills=skills,
            education=education, projects=projects, raw_text=resume_text,
            qualification=qualification, stream=stream,
            total_experience=total_experience, year_of_passout=year_of_passout,
        )
        db.candidate_profiles.insert_one(profile.to_dict())

        # Store embeddings in ChromaDB for semantic search
        try:
            embedding_service = EmbeddingService()
            chunks = chunk_text(resume_text)
            if chunks:
                embeddings = embedding_service.encode(chunks)
                chroma_client = get_chroma_client()
                collection = chroma_client.get_or_create_collection(f"job_{job_id}")
                for i, chunk in enumerate(chunks):
                    collection.add(
                        ids=[f"{candidate_id}_{i}"],
                        embeddings=[embeddings[i].tolist()],
                        metadatas=[{"candidate_id": candidate_id, "chunk": i}],
                        documents=[chunk],
                    )
        except Exception as chroma_err:
            # ChromaDB failure should not block the application submission
            LOGGER.warning(f"ChromaDB storage failed (non-critical): {chroma_err}")

        LOGGER.info(f"Application submitted: {candidate_id} for job {job_id}")
        return {"application_id": str(result.inserted_id), "status": "submitted"}

    @staticmethod
    def get_my_applications(candidate_id: str) -> list[dict]:
        """Get candidate's applications enriched with job info — single batch query."""
        db = get_db()
        applications = list(
            db.applications.find({"candidate_id": candidate_id}).sort("applied_at", -1)
        )
        if not applications:
            return []

        # Batch fetch all referenced jobs in one query instead of one per application
        job_ids = [ObjectId(app["job_id"]) for app in applications if app.get("job_id")]
        jobs_map = {
            str(j["_id"]): j
            for j in db.jobs.find(
                {"_id": {"$in": job_ids}},
                {"title": 1, "company": 1, "company_location": 1, "status": 1},
            )
        }

        result = []
        for app in applications:
            app["_id"] = str(app["_id"])
            if "applied_at" in app:
                app["applied_at"] = app["applied_at"].isoformat()
            if "updated_at" in app:
                app["updated_at"] = app["updated_at"].isoformat()
            job = jobs_map.get(app.get("job_id", ""), {})
            app["job_title"] = job.get("title", "")
            app["job_company"] = job.get("company", "")
            app["job_location"] = job.get("company_location", "")
            app["job_status"] = job.get("status", "")
            result.append(app)
        return result

    @staticmethod
    def has_applied(candidate_id: str, job_id: str) -> bool:
        """Check if candidate already applied for a job."""
        db = get_db()
        return db.applications.find_one({"candidate_id": candidate_id, "job_id": job_id}) is not None
