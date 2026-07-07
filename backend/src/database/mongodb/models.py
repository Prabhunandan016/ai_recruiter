"""MongoDB data models and schemas."""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Any

from pydantic import BaseModel, Field


class UserRole(str, Enum):
    RECRUITER = "recruiter"
    CANDIDATE = "candidate"


class JobStatus(str, Enum):
    ACTIVE = "active"
    CLOSED = "closed"
    DRAFT = "draft"


class ApplicationStatus(str, Enum):
    SUBMITTED = "submitted"
    UNDER_REVIEW = "under_review"
    SHORTLISTED = "shortlisted"
    REJECTED = "rejected"


class User(BaseModel):
    email: str
    password_hash: str
    role: UserRole
    name: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

    def to_dict(self) -> dict[str, Any]:
        return {
            "email": self.email,
            "password_hash": self.password_hash,
            "role": self.role.value,
            "name": self.name,
            "created_at": self.created_at,
        }


class Job(BaseModel):
    recruiter_id: str
    title: str
    company: str
    company_location: str = ""
    work_location: str = "on-site"
    job_type: str = "full-time"
    required_qualifications: list[str] = Field(default_factory=list)
    required_streams: list[str] = Field(default_factory=list)
    exp_min: float = 0.0
    exp_max: float = 5.0
    job_description: str
    required_skills: list[str]
    preferred_skills: list[str]
    behavioral_requirements: list[str]
    additional_requirements: str = ""
    status: JobStatus = JobStatus.ACTIVE
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    def to_dict(self) -> dict[str, Any]:
        return {
            "recruiter_id": self.recruiter_id,
            "title": self.title,
            "company": self.company,
            "company_location": self.company_location,
            "work_location": self.work_location,
            "job_type": self.job_type,
            "required_qualifications": self.required_qualifications,
            "required_streams": self.required_streams,
            "exp_min": self.exp_min,
            "exp_max": self.exp_max,
            "job_description": self.job_description,
            "required_skills": self.required_skills,
            "preferred_skills": self.preferred_skills,
            "behavioral_requirements": self.behavioral_requirements,
            "additional_requirements": self.additional_requirements,
            "status": self.status.value,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
        }


class Application(BaseModel):
    candidate_id: str
    job_id: str
    name: str
    email: str
    phone: str
    resume_path: str
    qualification: str = ""
    stream: str = ""
    total_experience: float = 0.0
    year_of_passout: int = 0
    status: ApplicationStatus = ApplicationStatus.SUBMITTED
    applied_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    def to_dict(self) -> dict[str, Any]:
        return {
            "candidate_id": self.candidate_id,
            "job_id": self.job_id,
            "name": self.name,
            "email": self.email,
            "phone": self.phone,
            "resume_path": self.resume_path,
            "qualification": self.qualification,
            "stream": self.stream,
            "total_experience": self.total_experience,
            "year_of_passout": self.year_of_passout,
            "status": self.status.value,
            "applied_at": self.applied_at,
            "updated_at": self.updated_at,
        }


class CandidateProfile(BaseModel):
    candidate_id: str
    job_id: str
    skills: list[str] = Field(default_factory=list)
    education: list[str] = Field(default_factory=list)
    experience: list[str] = Field(default_factory=list)
    projects: list[str] = Field(default_factory=list)
    qualification: str = ""
    stream: str = ""
    total_experience: float = 0.0
    year_of_passout: int = 0
    raw_text: str = ""
    created_at: datetime = Field(default_factory=datetime.utcnow)

    def to_dict(self) -> dict[str, Any]:
        return {
            "candidate_id": self.candidate_id,
            "job_id": self.job_id,
            "skills": self.skills,
            "education": self.education,
            "experience": self.experience,
            "projects": self.projects,
            "qualification": self.qualification,
            "stream": self.stream,
            "total_experience": self.total_experience,
            "year_of_passout": self.year_of_passout,
            "raw_text": self.raw_text,
            "created_at": self.created_at,
        }


class RankingResult:
    """
    Ranking result. Uses a plain class (not dataclass) so we can have
    non-serialized internal attributes without dataclass field mangling.
    """

    def __init__(
        self,
        candidate_name: str,
        email: str,
        phone: str,
        semantic_score: float,
        skill_score: float,
        career_score: float,
        behavior_score: float,
        education_score: float,
        project_score: float,
        qualification_score: float,
        additional_req_score: float,
        penalty_score: float,
        final_score: float,
        reason: str,
        resume_path: str = "",
        qualification: str = "",
        stream: str = "",
        total_experience: float = 0.0,
        year_of_passout: int = 0,
        matched_skills: list | None = None,
        missing_skills: list | None = None,
        employment_gap: bool = False,
        gap_note: str = "",
        # Internal — not persisted
        scores_dict: dict | None = None,
        penalties: list | None = None,
    ) -> None:
        self.candidate_name = candidate_name
        self.email = email
        self.phone = phone
        self.semantic_score = semantic_score
        self.skill_score = skill_score
        self.career_score = career_score
        self.behavior_score = behavior_score
        self.education_score = education_score
        self.project_score = project_score
        self.qualification_score = qualification_score
        self.additional_req_score = additional_req_score
        self.penalty_score = penalty_score
        self.final_score = final_score
        self.reason = reason
        self.resume_path = resume_path
        self.qualification = qualification
        self.stream = stream
        self.total_experience = total_experience
        self.year_of_passout = year_of_passout
        self.matched_skills = matched_skills or []
        self.missing_skills = missing_skills or []
        self.employment_gap = employment_gap
        self.gap_note = gap_note
        # Internal scratch — excluded from to_dict
        self._scores_dict: dict = scores_dict or {}
        self._penalties: list = penalties or []

    def to_dict(self) -> dict[str, Any]:
        return {
            "candidate_name": self.candidate_name,
            "email": self.email,
            "phone": self.phone,
            "semantic_score": self.semantic_score,
            "skill_score": self.skill_score,
            "career_score": self.career_score,
            "behavior_score": self.behavior_score,
            "education_score": self.education_score,
            "project_score": self.project_score,
            "qualification_score": self.qualification_score,
            "additional_req_score": self.additional_req_score,
            "penalty_score": self.penalty_score,
            "final_score": self.final_score,
            "reason": self.reason,
            "resume_path": self.resume_path,
            "qualification": self.qualification,
            "stream": self.stream,
            "total_experience": self.total_experience,
            "year_of_passout": self.year_of_passout,
            "matched_skills": self.matched_skills,
            "missing_skills": self.missing_skills,
            "employment_gap": self.employment_gap,
            "gap_note": self.gap_note,
        }
