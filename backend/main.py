"""
MediRemind API - Main Application Entry Point

This is the slim entrypoint that registers routers and middleware.
All endpoint logic has been modularized into the routers/ package.
"""
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from dotenv import load_dotenv

from database import engine
import models
from logging_config import get_api_logger

# Import routers
from routers import (
    auth_router,
    predictions_router,
    users_router,
    medications_router,
    notifications_router
)

# Initialize logger
logger = get_api_logger()

# Load environment variables
load_dotenv()

# Ensure database tables exist
models.Base.metadata.create_all(bind=engine)

# --- Rate Limiter Configuration ---
# Uses IP address for anonymous users, can be extended to use user ID
limiter = Limiter(key_func=get_remote_address)

# Create FastAPI application
app = FastAPI(
    title="Medication Reminder + Health Risk Predictor API",
    description="AI-powered medication management with NLEM 2022 grounded health predictions",
    version="2.1.0"
)

# Attach limiter to app state (required for slowapi)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# --- CORS Configuration ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Register Routers ---
app.include_router(auth_router)
app.include_router(predictions_router)
app.include_router(users_router)
app.include_router(medications_router)
app.include_router(notifications_router)


# --- Health Check ---
@app.get("/", tags=["Health"])
def root():
    """API health check endpoint."""
    return {
        "status": "healthy",
        "app": "MediRemind API",
        "version": "2.0.0"
    }


@app.get("/health", tags=["Health"])
def health_check():
    """Detailed health check."""
    return {
        "status": "ok",
        "database": "connected",
        "routers": [
            "auth",
            "predictions", 
            "users",
            "medications",
            "notifications"
        ]
    }


if __name__ == "__main__":
    import uvicorn
    logger.info("Starting MediRemind API server...")
    uvicorn.run(app, host="0.0.0.0", port=8000)
