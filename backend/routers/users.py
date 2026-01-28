"""
Users router - handles user profile and medication history.
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db
import models
import auth
from auth import get_current_user, UserResponse, UserUpdate
from logging_config import get_api_logger

logger = get_api_logger()
router = APIRouter(prefix="/users", tags=["User Profile"])


@router.get("/me", response_model=UserResponse)
async def read_users_me(current_user: models.User = Depends(get_current_user)):
    """Get current user profile."""
    return current_user


@router.put("/me", response_model=UserResponse)
async def update_user_me(
    user_update: UserUpdate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update current user profile."""
    if user_update.full_name is not None:
        current_user.full_name = user_update.full_name
    if user_update.phone_number is not None:
        current_user.phone_number = user_update.phone_number
    if user_update.email_notifications is not None:
        current_user.email_notifications = user_update.email_notifications
    
    db.commit()
    db.refresh(current_user)
    logger.info(f"Updated profile for {current_user.email}")
    return current_user


# Medication history is user-related, so included here
@router.get("/me/reminders/history")
async def get_medication_history(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get history of taken/skipped medications for current user."""
    history = db.query(models.Reminder).join(models.Medication).filter(
        models.Medication.user_id == current_user.id,
        models.Reminder.status.in_([models.ReminderStatus.TAKEN, models.ReminderStatus.SKIPPED])
    ).order_by(models.Reminder.scheduled_time.desc()).limit(50).all()
    
    return history
