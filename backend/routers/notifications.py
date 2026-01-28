"""
Notifications router - handles SSE stream, web push subscriptions, and VAPID keys.
"""
import json
import asyncio

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database import get_db
import models
from auth import get_current_user, get_current_user_from_token
from logging_config import get_api_logger

logger = get_api_logger()
router = APIRouter(tags=["Notifications"])


# --- SCHEMAS ---
class SubscriptionRequest(BaseModel):
    endpoint: str
    keys: dict


# --- SSE GENERATOR ---
async def notification_generator(token: str):
    """Yields events when reminders are DUE. Requires valid token."""
    # Validate token once
    db = next(get_db())
    try:
        await get_current_user_from_token(token, db)
    except HTTPException:
        yield f"data: {json.dumps({'error': 'Unauthorized'})}\n\n"
        return
    finally:
        db.close()
    
    while True:
        db = next(get_db())
        try:
            # Fetch all DUE reminders
            due_reminders = db.query(models.Reminder).join(models.Medication).filter(
                models.Reminder.status == models.ReminderStatus.DUE
            ).all()
            
            if due_reminders:
                for reminder in due_reminders:
                    med = reminder.medication
                    is_high_risk = med.priority == "HIGH"
                    
                    friendly_message = f"It's time for your {med.name} ({med.dosage})"
                    
                    if med.instructions and med.instructions.lower() not in ["test", "take as directed"]:
                        friendly_message += f" — {med.instructions}"
                    
                    disclaimer = None
                    if is_high_risk:
                        disclaimer = "This is an important medication. If you've missed this dose, please consult your healthcare provider before adjusting your schedule."
                    
                    data = {
                        "id": reminder.id,
                        "medicationName": med.name,
                        "dosage": med.dosage,
                        "instructions": med.instructions or "Take as directed",
                        "scheduledTime": reminder.scheduled_time.isoformat(),
                        "message": friendly_message,
                        "isHighRisk": is_high_risk,
                        "disclaimer": disclaimer,
                        "actionLabel": "Mark as Taken"
                    }
                    yield f"data: {json.dumps(data)}\n\n"
                    
                    reminder.status = models.ReminderStatus.SENT
                db.commit()
            
        except Exception as e:
            logger.error(f"SSE Error: {e}")
        finally:
            db.close()
            
        await asyncio.sleep(2)


# --- ENDPOINTS ---
@router.get("/notifications/stream")
async def notification_stream(token: str = Query(..., description="JWT token for authentication")):
    """SSE stream for real-time reminders. Requires token."""
    return StreamingResponse(
        notification_generator(token), 
        media_type="text/event-stream"
    )


@router.post("/subscribe")
def subscribe(
    subscription: SubscriptionRequest,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Register web push subscription. Requires authentication.
    Stores the subscription endpoint and keys for later push notifications.
    """
    # Check if subscription already exists for this endpoint
    existing = db.query(models.PushSubscription).filter(
        models.PushSubscription.endpoint == subscription.endpoint
    ).first()
    
    if existing:
        # Update existing subscription
        existing.user_id = current_user.id
        existing.p256dh_key = subscription.keys.get("p256dh", "")
        existing.auth_key = subscription.keys.get("auth", "")
        logger.info(f"Updated push subscription for {current_user.email}")
    else:
        # Create new subscription
        new_sub = models.PushSubscription(
            user_id=current_user.id,
            endpoint=subscription.endpoint,
            p256dh_key=subscription.keys.get("p256dh", ""),
            auth_key=subscription.keys.get("auth", "")
        )
        db.add(new_sub)
        logger.info(f"Created push subscription for {current_user.email}")
    
    db.commit()
    return {"message": "Subscribed successfully"}


@router.get("/vapid-public-key")
def get_vapid_key():
    """Get the VAPID public key for Web Push subscription on frontend."""
    from push_notifications import get_vapid_public_key
    public_key = get_vapid_public_key()
    if not public_key:
        raise HTTPException(status_code=503, detail="Push notifications not configured")
    return {"publicKey": public_key}


@router.delete("/subscribe")
def unsubscribe(
    endpoint: str,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Unsubscribe from push notifications."""
    sub = db.query(models.PushSubscription).filter(
        models.PushSubscription.endpoint == endpoint,
        models.PushSubscription.user_id == current_user.id
    ).first()
    
    if sub:
        db.delete(sub)
        db.commit()
        logger.info(f"Removed push subscription for {current_user.email}")
    
    return {"message": "Unsubscribed successfully"}


# Legacy endpoint for backwards compatibility
@router.get("/reminders/history")
async def get_medication_history_legacy(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get history of taken/skipped medications. (Legacy - use /users/me/reminders/history)"""
    history = db.query(models.Reminder).join(models.Medication).filter(
        models.Reminder.status.in_([models.ReminderStatus.TAKEN, models.ReminderStatus.SKIPPED])
    ).order_by(models.Reminder.scheduled_time.desc()).limit(50).all()
    return history
