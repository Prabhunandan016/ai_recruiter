"""Shared utility functions."""

from __future__ import annotations

import os
from pathlib import Path


def ensure_directory(path: str | Path) -> Path:
    """Create directory if it does not exist."""
    directory = Path(path)
    directory.mkdir(parents=True, exist_ok=True)
    return directory


def get_upload_path() -> Path:
    """Get the upload directory path."""
    from src.config import get_settings
    settings = get_settings()
    return ensure_directory(settings.upload_dir)


def get_chromadb_path() -> Path:
    """Get the ChromaDB directory path."""
    from src.config import get_settings
    settings = get_settings()
    return ensure_directory(settings.chromadb_path)
