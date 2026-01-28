from sqlalchemy.orm import Session
from database import SessionLocal
import models
import time

db = SessionLocal()
# Get the most recent reminder
reminder = db.query(models.Reminder).order_by(models.Reminder.id.desc()).first()
if reminder:
    print(f"Reminder ID: {reminder.id}")
    print(f"Medication: {reminder.medication.name}")
    print(f"Time: {reminder.scheduled_time}")
    print(f"Status: {reminder.status}")
else:
    print("No reminders found.")
db.close()
