"""
Routers package - exports all API routers.
"""
from routers.auth import router as auth_router
from routers.predictions import router as predictions_router
from routers.users import router as users_router
from routers.medications import router as medications_router
from routers.notifications import router as notifications_router

__all__ = [
    "auth_router",
    "predictions_router", 
    "users_router",
    "medications_router",
    "notifications_router"
]
