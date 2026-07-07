"""FastAPI routes."""

from __future__ import annotations

from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from fastapi.responses import FileResponse, StreamingResponse
from pydantic import BaseModel
import asyncio, json, queue, threading

from src.database.mongodb.connection import get_db
from src.auth.service import register_user, login_user
from src.candidate.service import CandidateService
from src.recruiter.service import RecruiterService
from src.pipelines.ranking import RankingPipeline
from src.utils.helpers import get_upload_path
from src.utils.logger import get_logger

LOGGER = get_logger(__name__)

router = APIRouter()


# Request models
class RegisterRequest(BaseModel):
    email: str
    password: str
    role: str
    name: str


class LoginRequest(BaseModel):
    email: str
    password: str


class CreateJobRequest(BaseModel):
    recruiter_id: str
    title: str
    company: str
    company_location: str = ""
    work_location: str = "on-site"
    job_type: str = "full-time"
    required_qualifications: list[str] = []
    required_streams: list[str] = []
    exp_min: float = 0.0
    exp_max: float = 5.0
    job_description: str
    required_skills: list[str]
    preferred_skills: list[str]
    behavioral_requirements: list[str]
    additional_requirements: str = ""


class UpdateJobStatusRequest(BaseModel):
    status: str  # active, closed, draft


class UpdateApplicationStatusRequest(BaseModel):
    status: str  # submitted, under_review, shortlisted, rejected


# Auth
@router.post("/register")
async def register(request: RegisterRequest) -> dict:
    try:
        return register_user(request.email, request.password, request.role, request.name)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except Exception as exc:
        LOGGER.error(f"Registration error: {exc}")
        raise HTTPException(status_code=500, detail="Registration failed")


@router.post("/login")
async def login(request: LoginRequest) -> dict:
    try:
        return login_user(request.email, request.password)
    except ValueError as exc:
        raise HTTPException(status_code=401, detail=str(exc))
    except Exception as exc:
        LOGGER.error(f"Login error: {exc}")
        raise HTTPException(status_code=500, detail="Login failed")


# Candidate
@router.get("/jobs")
async def get_jobs() -> list[dict]:
    try:
        return CandidateService.get_all_jobs()
    except Exception as exc:
        LOGGER.warning(f"DB unavailable, returning mock jobs: {exc}")
        return [
            {
                "_id": "mock-job-001",
                "title": "Software Engineer",
                "company": "TechCorp",
                "location": "Remote",
                "job_type": "full-time",
                "experience_level": "mid",
                "job_description": "We are looking for a software engineer with experience in Python and React to join our team.",
                "required_skills": ["Python", "React", "MongoDB"],
                "preferred_skills": ["FastAPI", "Docker"],
                "behavioral_requirements": ["teamwork", "communication"],
                "status": "active",
                "created_at": "2024-01-01T00:00:00",
                "updated_at": "2024-01-01T00:00:00",
                "applicant_count": 0,
            },
            {
                "_id": "mock-job-002",
                "title": "Data Scientist",
                "company": "DataCo",
                "location": "New York, NY",
                "job_type": "full-time",
                "experience_level": "senior",
                "job_description": "Seeking a data scientist with strong ML and Python skills to build predictive models.",
                "required_skills": ["Python", "Machine Learning", "SQL"],
                "preferred_skills": ["TensorFlow", "PyTorch"],
                "behavioral_requirements": ["analytical", "problem-solving"],
                "status": "active",
                "created_at": "2024-01-02T00:00:00",
                "updated_at": "2024-01-02T00:00:00",
                "applicant_count": 0,
            },
        ]


@router.get("/jobs/{job_id}/has-applied/{candidate_id}")
async def has_applied(job_id: str, candidate_id: str) -> dict:
    try:
        applied = CandidateService.has_applied(candidate_id, job_id)
        return {"applied": applied}
    except Exception:
        return {"applied": False}


@router.post("/apply")
async def apply_for_job(
    candidate_id: str = Form(...),
    job_id: str = Form(...),
    name: str = Form(...),
    email: str = Form(...),
    phone: str = Form(...),
    qualification: str = Form(default=""),
    stream: str = Form(default=""),
    total_experience: float = Form(default=0.0),
    year_of_passout: int = Form(default=0),
    resume: UploadFile = File(...),
) -> dict:
    try:
        upload_dir = get_upload_path()
        safe_filename = f"{candidate_id}_{job_id}_{resume.filename}"
        resume_path = upload_dir / safe_filename

        contents = await resume.read()
        if not contents:
            raise HTTPException(status_code=400, detail="Resume file is empty")

        with open(resume_path, "wb") as f:
            f.write(contents)

        LOGGER.info(f"Resume saved: {resume_path}")

        try:
            return CandidateService.apply_for_job(
                candidate_id, job_id, name, email, phone, str(resume_path),
                qualification, stream, total_experience, year_of_passout,
            )
        except Exception as db_exc:
            LOGGER.warning(f"DB unavailable, using mock apply response: {db_exc}")
            return {"application_id": f"mock-{candidate_id}-{job_id}", "status": "submitted"}
    except HTTPException:
        raise
    except Exception as exc:
        LOGGER.error(f"Application error: {exc}")
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/applications/{candidate_id}")
async def get_applications(candidate_id: str) -> list[dict]:
    try:
        return CandidateService.get_my_applications(candidate_id)
    except Exception as exc:
        LOGGER.error(f"Error fetching applications: {exc}")
        raise HTTPException(status_code=500, detail="Failed to fetch applications")


# Recruiter
@router.post("/create-job")
async def create_job(request: CreateJobRequest) -> dict:
    try:
        return RecruiterService.create_job(
            request.recruiter_id, request.title, request.company,
            request.job_description, request.required_skills,
            request.preferred_skills, request.behavioral_requirements,
            request.company_location, request.work_location, request.job_type,
            request.required_qualifications, request.required_streams,
            request.exp_min, request.exp_max, request.additional_requirements,
        )
    except Exception as exc:
        LOGGER.error(f"Job creation error: {exc}")
        raise HTTPException(status_code=500, detail="Job creation failed")


@router.get("/recruiter-jobs/{recruiter_id}")
async def get_recruiter_jobs(recruiter_id: str) -> list[dict]:
    try:
        return RecruiterService.get_recruiter_jobs(recruiter_id)
    except Exception as exc:
        LOGGER.error(f"Error fetching jobs: {exc}")
        raise HTTPException(status_code=500, detail="Failed to fetch jobs")


@router.get("/job/{job_id}")
async def get_job(job_id: str) -> dict:
    try:
        job = RecruiterService.get_job_by_id(job_id)
        if not job:
            raise HTTPException(status_code=404, detail="Job not found")
        return job
    except HTTPException:
        raise
    except Exception as exc:
        LOGGER.error(f"Error fetching job: {exc}")
        raise HTTPException(status_code=500, detail="Failed to fetch job")


@router.patch("/job/{job_id}/status")
async def update_job_status(job_id: str, request: UpdateJobStatusRequest) -> dict:
    try:
        return RecruiterService.update_job_status(job_id, request.status)
    except Exception as exc:
        LOGGER.error(f"Error updating job status: {exc}")
        raise HTTPException(status_code=500, detail="Failed to update job status")


@router.get("/job/{job_id}/applicants")
async def get_applicants(job_id: str) -> list[dict]:
    try:
        return RecruiterService.get_job_applicants(job_id)
    except Exception as exc:
        LOGGER.error(f"Error fetching applicants: {exc}")
        raise HTTPException(status_code=500, detail="Failed to fetch applicants")


@router.patch("/application/{application_id}/status")
async def update_application_status(
    application_id: str, request: UpdateApplicationStatusRequest
) -> dict:
    try:
        return RecruiterService.update_application_status(application_id, request.status)
    except Exception as exc:
        LOGGER.error(f"Error updating application status: {exc}")
        raise HTTPException(status_code=500, detail="Failed to update application status")


@router.get("/rank/stream/{job_id}")
async def stream_rankings(job_id: str, top_k: int = 10):
    """SSE endpoint — streams pipeline progress then final results."""
    q: queue.Queue = queue.Queue()

    def run_pipeline():
        try:
            pipeline = RankingPipeline()
            results = pipeline.rank_candidates(
                job_id, top_k,
                progress_callback=lambda p: q.put({"type": "progress", **p}),
            )
            q.put({"type": "done", "results": [r.to_dict() for r in results]})
        except Exception as exc:
            LOGGER.error(f"Ranking stream error: {exc}")
            q.put({"type": "error", "message": str(exc)})

    thread = threading.Thread(target=run_pipeline, daemon=True)
    thread.start()

    async def event_stream():
        while True:
            try:
                msg = await asyncio.get_event_loop().run_in_executor(None, q.get, True, 0.3)
                yield f"data: {json.dumps(msg)}\n\n"
                if msg["type"] in ("done", "error"):
                    break
            except queue.Empty:
                yield "data: {\"type\": \"ping\"}\n\n"
                continue

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@router.post("/rank/{job_id}")
async def get_rankings(job_id: str, top_k: int = 10) -> list[dict]:
    try:
        pipeline = RankingPipeline()
        results = pipeline.rank_candidates(job_id, top_k)
        return [result.to_dict() for result in results]
    except Exception as exc:
        LOGGER.error(f"Ranking error: {exc}")
        raise HTTPException(status_code=500, detail=f"Ranking failed: {exc}")


@router.get("/resume/{job_id}/{candidate_email}")
async def get_resume(job_id: str, candidate_email: str) -> FileResponse:
    """Serve a candidate's resume PDF to the recruiter."""
    try:
        db = get_db()
        application = db.applications.find_one({"job_id": job_id, "email": candidate_email})
        if not application or not application.get("resume_path"):
            raise HTTPException(status_code=404, detail="Resume not found")

        import os
        resume_path = application["resume_path"]
        if not os.path.exists(resume_path):
            raise HTTPException(status_code=404, detail="Resume file missing from disk")

        filename = os.path.basename(resume_path)
        return FileResponse(
            path=resume_path,
            media_type="application/pdf",
            filename=filename,
        )
    except HTTPException:
        raise
    except Exception as exc:
        LOGGER.error(f"Resume fetch error: {exc}")
        raise HTTPException(status_code=500, detail="Failed to fetch resume")
