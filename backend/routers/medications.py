"""
Medications router - handles medication CRUD operations.
"""
import datetime

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database import get_db
import models
from auth import get_current_user
from logging_config import get_api_logger

logger = get_api_logger()
router = APIRouter(prefix="/medications", tags=["Medications"])


# --- SCHEMAS ---
class MedicationCreate(BaseModel):
    name: str
    dosage: str
    frequency: str
    instructions: str
    start_date: str
    end_date: str = None
    reminders: list[str]  # List of time strings "HH:MM"


# --- ENDPOINTS ---
@router.post("")
def create_medication(
    med: MedicationCreate, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Create a new medication with reminders. Requires authentication."""
    db_med = models.Medication(
        name=med.name,
        dosage=med.dosage,
        frequency=med.frequency,
        instructions=med.instructions,
        start_date=datetime.datetime.now(),
        user_id=current_user.id
    )
    db.add(db_med)
    db.commit()
    db.refresh(db_med)
    
    today = datetime.datetime.utcnow().date()
    
    for time_str in med.reminders:
        try:
            hour, minute = map(int, time_str.split(":"))
            scheduled_time = datetime.datetime.combine(today, datetime.time(hour=hour, minute=minute))
            
            db_reminder = models.Reminder(
                medication_id=db_med.id,
                scheduled_time=scheduled_time,
                status=models.ReminderStatus.PENDING
            )
            db.add(db_reminder)
        except ValueError:
            pass
            
    db.commit()
    logger.info(f"Created medication '{med.name}' for {current_user.email}")
    return {"message": "Medication created successfully", "id": db_med.id}


@router.get("")
def list_medications(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """List all medications for current user."""
    medications = db.query(models.Medication).filter(
        models.Medication.user_id == current_user.id
    ).all()
    return medications


@router.post("/test-trigger")
def test_trigger(
    minutes: int = 0, 
    high_risk: bool = False, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Creates a test medication for notification testing. Requires authentication."""
    due_time = datetime.datetime.utcnow() + datetime.timedelta(minutes=minutes)
    
    if high_risk:
        med = models.Medication(
            name="Warfarin",
            dosage="5mg",
            frequency="Once daily",
            instructions="Take at the same time each day. Do not skip doses.",
            start_date=datetime.datetime.utcnow(),
            priority="HIGH",
            user_id=current_user.id
        )
    else:
        med = models.Medication(
            name="Vitamin D",
            dosage="1000 IU",
            frequency="Once daily",
            instructions="Take with food.",
            start_date=datetime.datetime.utcnow(),
            user_id=current_user.id,
            priority="NORMAL"
        )
    
    db.add(med)
    db.commit()
    db.refresh(med)
    
    reminder = models.Reminder(
        medication_id=med.id,
        scheduled_time=due_time,
        status=models.ReminderStatus.PENDING
    )
    db.add(reminder)
    db.commit()
    
    logger.info(f"Created test reminder for {current_user.email}: {med.name}")
    return {
        "message": f"Created {'HIGH-RISK' if high_risk else 'normal'} test reminder for {due_time} UTC", 
        "medication": med.name
    }
