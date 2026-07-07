"""MongoDB database connection and collections."""

from __future__ import annotations

from pymongo import MongoClient, ASCENDING, DESCENDING
from pymongo.database import Database

from src.config import get_settings
from src.utils.logger import get_logger

LOGGER = get_logger(__name__)


class MongoDBConnection:
    """Manage MongoDB connection."""

    _client: MongoClient | None = None
    _database: Database | None = None

    @classmethod
    def connect(cls) -> Database:
        """Connect to MongoDB and return database instance."""
        if cls._database is None:
            settings = get_settings()
            try:
                cls._client = MongoClient(
                    settings.mongo_uri,
                    serverSelectionTimeoutMS=3000,
                    connectTimeoutMS=3000,
                    socketTimeoutMS=10000,
                    maxPoolSize=20,          # connection pool — reuse connections
                    minPoolSize=2,
                )
                cls._client.admin.command("ping")
                cls._database = cls._client[settings.database_name]
                cls._ensure_indexes(cls._database)
                LOGGER.info("Connected to MongoDB")
            except Exception as exc:
                LOGGER.error(f"Failed to connect to MongoDB: {exc}")
                raise
        return cls._database

    @classmethod
    def _ensure_indexes(cls, db: Database) -> None:
        """Create indexes only if they don't already exist (fast on subsequent calls)."""
        try:
            db.users.create_index("email", unique=True, background=True)
            db.jobs.create_index("recruiter_id", background=True)
            db.jobs.create_index([("status", ASCENDING), ("created_at", DESCENDING)], background=True)
            db.applications.create_index(
                [("candidate_id", ASCENDING), ("job_id", ASCENDING)], unique=True, background=True
            )
            db.applications.create_index("job_id", background=True)
            db.applications.create_index("candidate_id", background=True)
            db.candidate_profiles.create_index(
                [("candidate_id", ASCENDING), ("job_id", ASCENDING)], unique=True, background=True
            )
            db.rankings.create_index([("job_id", ASCENDING), ("final_score", DESCENDING)], background=True)
            LOGGER.info("MongoDB indexes ensured")
        except Exception as exc:
            LOGGER.warning(f"Index creation warning: {exc}")

    @classmethod
    def close(cls) -> None:
        """Close MongoDB connection."""
        if cls._client:
            cls._client.close()
            cls._database = None
            cls._client = None
            LOGGER.info("Disconnected from MongoDB")

    @classmethod
    def get_database(cls) -> Database:
        """Get database instance."""
        if cls._database is None:
            cls.connect()
        return cls._database


def get_db() -> Database:
    """Get MongoDB database instance."""
    return MongoDBConnection.get_database()
