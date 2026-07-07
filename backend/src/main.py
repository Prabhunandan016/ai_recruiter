"""Main FastAPI application."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.api.routes import router
from src.database.mongodb.connection import MongoDBConnection
from src.utils.logger import get_logger

LOGGER = get_logger(__name__)

app = FastAPI(
    title="Intelligent Candidate Discovery",
    description="AI-powered recruitment system",
    version="1.0.0",
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routes
app.include_router(router)


@app.on_event("startup")
async def startup_event():
    """Initialize on startup."""
    LOGGER.info("Starting Intelligent Candidate Discovery")
    MongoDBConnection.connect()


@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown."""
    LOGGER.info("Shutting down")
    MongoDBConnection.close()


@app.get("/health")
async def health() -> dict[str, str]:
    """Health check endpoint."""
    return {"status": "ok"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
