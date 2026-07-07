"""ChromaDB connection and management."""

from __future__ import annotations

from src.utils.helpers import get_chromadb_path
from src.utils.logger import get_logger

LOGGER = get_logger(__name__)


class ChromaDBConnection:
    """Manage ChromaDB connection."""

    _client = None

    @classmethod
    def connect(cls):
        if cls._client is None:
            import chromadb
            try:
                chromadb_path = str(get_chromadb_path())
                cls._client = chromadb.PersistentClient(path=chromadb_path)
                LOGGER.info(f"Connected to ChromaDB at {chromadb_path}")
            except Exception as exc:
                LOGGER.error(f"Failed to connect to ChromaDB: {exc}")
                raise
        return cls._client

    @classmethod
    def get_client(cls):
        if cls._client is None:
            cls.connect()
        return cls._client


def get_chroma_client():
    return ChromaDBConnection.get_client()
