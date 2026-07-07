"""Simple authentication service."""

from __future__ import annotations

import hashlib
import secrets

from src.database.mongodb.connection import get_db
from src.database.mongodb.models import User, UserRole
from src.utils.logger import get_logger

LOGGER = get_logger(__name__)


def hash_password(password: str) -> str:
    """Hash password using SHA256."""
    return hashlib.sha256(password.encode()).hexdigest()


def verify_password(password: str, hash_value: str) -> bool:
    """Verify password against hash."""
    return hash_password(password) == hash_value


def register_user(email: str, password: str, role: str, name: str) -> dict[str, str]:
    """Register a new user."""
    db = get_db()

    if db.users.find_one({"email": email}):
        raise ValueError("Email already registered")

    user_role = UserRole.RECRUITER if role == "recruiter" else UserRole.CANDIDATE
    user = User(
        email=email,
        password_hash=hash_password(password),
        role=user_role,
        name=name,
    )

    result = db.users.insert_one(user.to_dict())
    LOGGER.info(f"User registered: {email}")

    return {"user_id": str(result.inserted_id), "email": email, "role": role, "name": name}


def login_user(email: str, password: str) -> dict[str, str]:
    """Authenticate user."""
    db = get_db()

    user_doc = db.users.find_one({"email": email})
    if not user_doc:
        raise ValueError("Invalid credentials")

    if not verify_password(password, user_doc["password_hash"]):
        raise ValueError("Invalid credentials")

    token = secrets.token_hex(32)
    db.users.update_one({"_id": user_doc["_id"]}, {"$set": {"session_token": token}})

    LOGGER.info(f"User logged in: {email}")

    return {
        "user_id": str(user_doc["_id"]),
        "email": email,
        "role": user_doc["role"],
        "name": user_doc["name"],
        "token": token,
    }
