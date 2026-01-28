from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Enum, Float, JSON, Boolean
from sqlalchemy.orm import relationship
from database import Base
import datetime
import enum

class ReminderStatus(str, enum.Enum):
    PENDING = "PENDING"
    DUE = "DUE"  # Ready to notify
    SENT = "SENT" # Notification sent
    TAKEN = "TAKEN"
    SKIPPED = "SKIPPED"

class MedicationPriority(str, enum.Enum):
    NORMAL = "NORMAL"
    HIGH = "HIGH"  # High-risk medications requiring disclaimers

class Medication(Base):
    __tablename__ = "medications"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    dosage = Column(String)
    frequency = Column(String)
    instructions = Column(String)
    start_date = Column(DateTime, default=datetime.datetime.utcnow)
    end_date = Column(DateTime, nullable=True)
    priority = Column(String, default=MedicationPriority.NORMAL)
    user_id = Column(Integer, ForeignKey("users.id"))  # Link to User
    
    reminders = relationship("Reminder", back_populates="medication")
    user = relationship("User", back_populates="medications")

class Reminder(Base):
    __tablename__ = "reminders"

    id = Column(Integer, primary_key=True, index=True)
    medication_id = Column(Integer, ForeignKey("medications.id"))
    scheduled_time = Column(DateTime, index=True)
    status = Column(String, default=ReminderStatus.PENDING)
    
    medication = relationship("Medication", back_populates="reminders")

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    is_active = Column(Boolean, default=True)
    
    # Profile Fields
    full_name = Column(String, nullable=True)
    phone_number = Column(String, nullable=True)
    email_notifications = Column(Boolean, default=False)

    medications = relationship("Medication", back_populates="user")
    push_subscriptions = relationship("PushSubscription", back_populates="user")


class PushSubscription(Base):
    """Stores Web Push subscription data for browser notifications."""
    __tablename__ = "push_subscriptions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    endpoint = Column(String, unique=True, index=True)  # Push service URL
    p256dh_key = Column(String)  # Public key for encryption
    auth_key = Column(String)    # Authentication secret
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="push_subscriptions")
