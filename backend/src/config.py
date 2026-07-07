"""Application configuration loaded from environment variables."""

from __future__ import annotations

import os
from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings."""

    mongo_uri: str = os.getenv("MONGO_URI", "mongodb://localhost:27017")
    groq_api_key: str = os.getenv("GROQ_API_KEY", "")
    embedding_model: str = os.getenv("EMBEDDING_MODEL", "sentence-transformers/all-MiniLM-L6-v2")
    llm_model: str = os.getenv("LLM_MODEL", "llama-3.3-70b-versatile")
    database_name: str = os.getenv("DATABASE_NAME", "recruitment_system")
    log_level: str = os.getenv("LOG_LEVEL", "INFO")
    upload_dir: str = os.getenv("UPLOAD_DIR", "uploads")
    chromadb_path: str = os.getenv("CHROMADB_PATH", "./chromadb_data")

    class Config:
        env_file = ".env"
        case_sensitive = False


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """Return cached settings."""
    return Settings()
