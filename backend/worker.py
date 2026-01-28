"""
Background worker for processing medication reminders.
Polls the database for due reminders and triggers notifications (email + push).
"""
import time
import datetime
import signal
import sys
from typing import Optional, List

from sqlalchemy.orm import Session

from database import SessionLocal, engine
import models
import notifications
import push_notifications
from logging_config import get_worker_logger
from exceptions import EmailDeliveryError

# Initialize logger
logger = get_worker_logger()

# Graceful shutdown flag
_shutdown_requested = False


def _signal_handler(signum: int, frame) -> None:
    """Handle shutdown signals gracefully."""
    global _shutdown_requested
    logger.info(f"Received signal {signum}, initiating graceful shutdown...")
    _shutdown_requested = True


def _get_db_session() -> Session:
    """Create a new database session."""
    return SessionLocal()


def _get_user_push_subscriptions(db: Session, user_id: int) -> List[models.PushSubscription]:
    """
    Get all push subscriptions for a user.
    
    Args:
        db: Database session
        user_id: ID of the user
    
    Returns:
        List of PushSubscription objects
    """
    return db.query(models.PushSubscription).filter(
        models.PushSubscription.user_id == user_id
    ).all()


def _send_push_to_user(
    db: Session,
    user: models.User,
    medication: models.Medication
) -> int:
    """
    Send push notifications to all of a user's subscribed browsers.
    
    Args:
        db: Database session
        user: The user to notify
        medication: The medication details
    
    Returns:
        Number of successful push notifications sent
    """
    subscriptions = _get_user_push_subscriptions(db, user.id)
    if not subscriptions:
        logger.debug(f"No push subscriptions for user {user.email}")
        return 0
    
    success_count = 0
    expired_subscriptions = []
    
    for sub in subscriptions:
        try:
            push_notifications.send_push_notification(
                endpoint=sub.endpoint,
                p256dh_key=sub.p256dh_key,
                auth_key=sub.auth_key,
                title=f"💊 {medication.name}",
                body=f"Time to take {medication.dosage} - {medication.instructions or 'Take as directed'}",
                tag=f"med-{medication.id}",
                url=f"/medications"
            )
            success_count += 1
        except push_notifications.PushNotificationError as e:
            if "expired" in str(e).lower() or "not found" in str(e).lower():
                expired_subscriptions.append(sub)
            logger.warning(f"Push notification failed: {e}")
    
    # Clean up expired subscriptions
    for expired_sub in expired_subscriptions:
        db.delete(expired_sub)
        logger.info(f"Removed expired subscription for user {user.email}")
    
    if expired_subscriptions:
        db.commit()
    
    return success_count


def _process_reminder(reminder: models.Reminder, db: Session) -> None:
    """
    Process a single due reminder.
    
    Args:
        reminder: The reminder to process
        db: Active database session
    """
    medication = reminder.medication
    user = medication.user
    
    logger.info(f"Processing reminder {reminder.id} for {medication.name}")
    
    # Update status to DUE
    reminder.status = models.ReminderStatus.DUE
    
    if not user:
        logger.warning(f"No user associated with medication {medication.id}")
        return
    
    # Send Email notification if enabled
    if user.email_notifications and user.email:
        try:
            subject = f"Medication Reminder: {medication.name}"
            body = _build_email_body(medication)
            notifications.send_email(user.email, subject, body)
            logger.info(f"Email notification sent to {user.email}")
        except EmailDeliveryError as e:
            logger.error(f"Failed to send email: {e}")
    
    # Send Push notifications to all subscribed browsers
    push_count = _send_push_to_user(db, user, medication)
    if push_count > 0:
        logger.info(f"Sent {push_count} push notification(s) to {user.email}")


def _build_email_body(medication: models.Medication) -> str:
    """
    Build HTML email body for medication reminder.
    
    Args:
        medication: The medication details
    
    Returns:
        HTML formatted email body
    """
    return f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">⏰ Time to take your medication</h2>
        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px;">
            <p style="font-size: 18px; margin: 0;">
                <strong>{medication.name}</strong> ({medication.dosage})
            </p>
            <p style="color: #6b7280; margin-top: 10px;">
                {medication.instructions or 'Take as directed'}
            </p>
        </div>
        <p style="color: #9ca3af; font-size: 12px; margin-top: 20px;">
            This is an automated reminder from MediRemind.
        </p>
    </div>
    """


def check_reminders() -> int:
    """
    Check for due reminders and process them.
    
    Returns:
        Number of reminders processed
    """
    db: Optional[Session] = None
    processed_count = 0
    
    try:
        db = _get_db_session()
        now = datetime.datetime.utcnow()
        
        # Query pending reminders that are due
        due_reminders = db.query(models.Reminder).filter(
            models.Reminder.status == models.ReminderStatus.PENDING,
            models.Reminder.scheduled_time <= now
        ).all()
        
        if due_reminders:
            logger.info(f"Found {len(due_reminders)} due reminder(s)")
            for reminder in due_reminders:
                _process_reminder(reminder, db)
                processed_count += 1
            db.commit()
        else:
            logger.debug("No due reminders found")
            
    except Exception as e:
        logger.error(f"Error checking reminders: {e}")
        if db:
            db.rollback()
    finally:
        if db:
            db.close()
    
    return processed_count


def run_worker(poll_interval: int = 10) -> None:
    """
    Main worker loop.
    
    Args:
        poll_interval: Seconds between reminder checks (default: 10)
    """
    global _shutdown_requested
    
    # Register signal handlers for graceful shutdown
    signal.signal(signal.SIGINT, _signal_handler)
    signal.signal(signal.SIGTERM, _signal_handler)
    
    logger.info(f"Starting Reminder Worker (poll interval: {poll_interval}s)")
    logger.info("Push notifications: " + ("ENABLED" if push_notifications.get_vapid_public_key() else "DISABLED (no VAPID keys)"))
    
    # Ensure tables exist
    models.Base.metadata.create_all(bind=engine)
    
    while not _shutdown_requested:
        try:
            check_reminders()
            time.sleep(poll_interval)
        except KeyboardInterrupt:
            logger.info("Keyboard interrupt received")
            break
    
    logger.info("Worker shutdown complete")


if __name__ == "__main__":
    run_worker()
