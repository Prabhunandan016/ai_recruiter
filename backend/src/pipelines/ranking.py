"""Ranking pipeline for candidates."""

from __future__ import annotations

import numpy as np
from bson import ObjectId

from src.database.mongodb.connection import get_db
from src.database.mongodb.models import RankingResult
from src.embeddings.service import EmbeddingService
from src.retrieval.hybrid import HybridRetriever
from src.reranker.cross_encoder import CrossEncoderReranker
from src.scoring.scorers import (
    SemanticScorer, SkillScorer, CareerScorer, BehaviorScorer,
    EducationScorer, ProjectRelevanceScorer, QualificationScorer,
    AdditionalRequirementsScorer, FinalScorer,
)
from src.detectors.keyword_stuffing import KeywordStuffingDetector
from src.detectors.services_only import ServicesOnlyDetector
from src.detectors.honeypot import HoneypotDetector
from src.detectors.buzzword import BuzzwordDetector
from src.pdf_processing.resume_parser import ResumeExtractor
from src.reasoning.generator import ReasoningGenerator
from src.utils.logger import get_logger

LOGGER = get_logger(__name__)


class RankingPipeline:
    def __init__(self) -> None:
        self.embedding_service = EmbeddingService()
        self.hybrid_retriever = HybridRetriever()
        self.reranker = CrossEncoderReranker()
        self.reasoning_gen = ReasoningGenerator()

    def rank_candidates(
        self,
        job_id: str,
        top_k: int = 10,
        progress_callback=None,
    ) -> list[RankingResult]:

        def emit(stage: str, pct: int, detail: str = "") -> None:
            if progress_callback:
                progress_callback({"stage": stage, "pct": pct, "detail": detail})

        db = get_db()

        # ── Load job ─────────────────────────────────────────────────────────
        try:
            job = db.jobs.find_one({"_id": ObjectId(job_id)})
        except Exception:
            job = None
        if not job:
            raise ValueError(f"Job {job_id} not found")

        job_description = job.get("job_description", "")
        required_skills = job.get("required_skills", [])
        behavioral_requirements = job.get("behavioral_requirements", [])
        exp_min = float(job.get("exp_min", 0.0))
        exp_max = float(job.get("exp_max", 5.0))
        required_qualifications = job.get("required_qualifications", [])
        required_streams = job.get("required_streams", [])
        additional_requirements = job.get("additional_requirements", "")

        # ── Load applicants ───────────────────────────────────────────────────
        emit("Loading applicants", 5, "Fetching applications from database")
        applicants = list(db.applications.find({"job_id": job_id}))
        if not applicants:
            return []

        candidate_ids = [app["candidate_id"] for app in applicants]
        profiles = {
            p["candidate_id"]: p
            for p in db.candidate_profiles.find(
                {"candidate_id": {"$in": candidate_ids}, "job_id": job_id}
            )
        }

        # ── Generate embeddings ───────────────────────────────────────────────
        emit("Generating embeddings", 20, f"Encoding {len(applicants)} resume(s) into vectors")
        documents: list[str] = []
        embeddings_list: list = []
        valid_applicants: list = []

        for app in applicants:
            cid = app["candidate_id"]
            if cid in profiles:
                raw = profiles[cid].get("raw_text", "")
                if raw.strip():
                    documents.append(raw)
                    embeddings_list.append(self.embedding_service.encode(raw)[0])
                    valid_applicants.append(app)

        if not documents:
            LOGGER.warning(f"No resume text found for any applicant in job {job_id}")
            return []

        embeddings_array = np.array(embeddings_list, dtype="float32")

        # ── BM25 sparse retrieval ─────────────────────────────────────────────
        emit("BM25 sparse retrieval", 38, "Running keyword-based sparse search")
        self.hybrid_retriever.index(documents, embeddings_array, list(range(len(documents))))

        # ── FAISS dense retrieval ─────────────────────────────────────────────
        emit("FAISS dense retrieval", 52, "Semantic similarity search over embeddings")
        job_embedding = self.embedding_service.encode(job_description)[0]
        retrieved = self.hybrid_retriever.retrieve(
            job_description, job_embedding, top_k=min(20, len(documents))
        )
        if not retrieved:
            return []

        # ── Cross-encoder reranking ───────────────────────────────────────────
        emit("Hybrid reranking", 65, "Cross-encoder neural reranking for precision")
        retrieved_indices = [idx for idx, _ in retrieved]
        retrieved_documents = [documents[idx] for idx in retrieved_indices]
        reranked = self.reranker.rerank(job_description, retrieved_documents, top_k=top_k)

        # ── Multi-factor scoring ──────────────────────────────────────────────
        emit("Multi-factor scoring", 80, "Scoring skills, experience, education, projects")
        extractor = ResumeExtractor()
        results: list[RankingResult] = []

        for _, (original_idx, _) in enumerate(reranked, 1):
            applicant_idx = retrieved_indices[original_idx]
            applicant = valid_applicants[applicant_idx]
            profile = profiles.get(applicant["candidate_id"], {})
            raw_text = profile.get("raw_text", "")
            candidate_embedding = embeddings_array[applicant_idx]

            # Experience: prefer candidate-submitted value, then extract from resume
            try:
                total_experience = float(
                    applicant.get("total_experience") or
                    profile.get("total_experience") or
                    0.0
                )
            except (ValueError, TypeError):
                total_experience = 0.0

            if total_experience == 0.0:
                total_experience = extractor.extract_experience_years(raw_text)

            qualification = applicant.get("qualification", "") or profile.get("qualification", "")
            stream = applicant.get("stream", "") or profile.get("stream", "")
            try:
                year_of_passout = int(
                    applicant.get("year_of_passout") or profile.get("year_of_passout") or 0
                )
            except (ValueError, TypeError):
                year_of_passout = 0
            candidate_skills = profile.get("skills", [])
            projects = profile.get("projects", [])
            education_list = profile.get("education", [])

            # ── Scores ───────────────────────────────────────────────────────
            semantic_score = SemanticScorer.score(job_embedding, candidate_embedding)

            skill_score, matched_skills, missing_skills = SkillScorer.score(
                required_skills, candidate_skills, raw_text
            )
            career_score = CareerScorer.score(total_experience, exp_min, exp_max)
            behavior_score = BehaviorScorer.score(raw_text, behavioral_requirements)

            gap_info = extractor.detect_education_gap(raw_text)
            education_score = EducationScorer.score(education_list, gap_info)

            qualification_score = QualificationScorer.score(
                required_qualifications, qualification, stream, required_streams
            )
            project_score = ProjectRelevanceScorer.score(
                projects, job_description, required_skills
            )
            additional_req_score = AdditionalRequirementsScorer.score(
                raw_text, additional_requirements
            )

            # ── Penalties ────────────────────────────────────────────────────
            penalties: list[str] = []
            penalty = 0.0

            kw_p = KeywordStuffingDetector.score(raw_text)
            if kw_p > 0:
                penalties.append("keyword stuffing")
                penalty += kw_p

            svc_p = ServicesOnlyDetector.score(raw_text, job_description)
            if svc_p > 0:
                penalties.append("services-only profile")
                penalty += svc_p

            hp_p = HoneypotDetector.score(raw_text, len(candidate_skills))
            if hp_p > 0:
                penalties.append("suspicious signals")
                penalty += hp_p

            bz_p = BuzzwordDetector.score(raw_text)
            if bz_p > 0:
                penalties.append("buzzword overload")
                penalty += bz_p

            if gap_info.get("has_gap"):
                penalties.append(gap_info["note"])

            penalty = min(0.4, penalty)

            # ── Final score ───────────────────────────────────────────────────
            final_score = FinalScorer.score(
                semantic_score, skill_score, career_score, behavior_score,
                education_score, project_score, qualification_score,
                additional_req_score, penalty,
            )

            results.append(RankingResult(
                candidate_name=applicant["name"],
                email=applicant["email"],
                phone=applicant["phone"],
                semantic_score=round(semantic_score, 3),
                skill_score=round(skill_score, 3),
                career_score=round(career_score, 3),
                behavior_score=round(behavior_score, 3),
                education_score=round(education_score, 3),
                project_score=round(project_score, 3),
                qualification_score=round(qualification_score, 3),
                additional_req_score=round(additional_req_score, 3),
                penalty_score=round(penalty, 3),
                final_score=round(final_score, 3),
                reason="",  # filled below
                resume_path=applicant.get("resume_path", ""),
                qualification=qualification,
                stream=stream,
                total_experience=total_experience,
                year_of_passout=year_of_passout,
                matched_skills=matched_skills,
                missing_skills=missing_skills,
                employment_gap=gap_info.get("has_gap", False),
                gap_note=gap_info.get("note", ""),
                scores_dict={
                    "semantic_score": semantic_score,
                    "skill_score": skill_score,
                    "career_score": career_score,
                    "behavior_score": behavior_score,
                    "education_score": education_score,
                    "project_score": project_score,
                    "qualification_score": qualification_score,
                    "experience_years": total_experience,
                    "exp_min": exp_min,
                    "exp_max": exp_max,
                    "matched_skills": matched_skills,
                    "missing_skills": missing_skills,
                },
                penalties=penalties,
            ))

        # ── Sort by final_score descending ────────────────────────────────────
        results.sort(key=lambda r: r.final_score, reverse=True)

        # ── Generate reasoning ────────────────────────────────────────────────
        emit("Generating AI reasoning", 92, f"Writing summaries for {len(results)} candidate(s)")
        for result in results:
            result.reason = self.reasoning_gen.generate(
                result.candidate_name,
                result._scores_dict,
                result._penalties,
            )

        # ── Persist ───────────────────────────────────────────────────────────
        try:
            db.rankings.delete_many({"job_id": job_id})
        except Exception as exc:
            LOGGER.warning(f"Failed to clear old rankings for job {job_id}: {exc}")

        for result in results:
            db.rankings.insert_one({"job_id": job_id, **result.to_dict()})

        emit("Complete", 100, f"Ranked {len(results)} candidate(s) successfully")
        LOGGER.info(f"Ranked {len(results)} candidates for job {job_id}")
        return results
