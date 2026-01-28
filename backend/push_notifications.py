"""
Web Push notification service using pywebpush.
Handles VAPID key configuration and sending push notifications to browsers.
"""
import os
import json
from typing import Optional
from dataclasses import dataclass

from pywebpush import webpush, WebPushException

from logging_config import get_notification_logger
from exceptions import NotificationError

# Initialize logger
logger = get_notification_logger()


@dataclass(frozen=True)
class VAPIDConfig:
    """VAPID (Voluntary Application Server Identification) configuration."""
    public_key: str
    private_key: str
    mailto: str  # Contact email for push service
    private_key_path: str = ""  # Alternative: path to PEM file
    
    @property
    def is_configured(self) -> bool:
        """Check if VAPID keys are properly configured."""
        return bool((self.public_key and self.private_key) or self.private_key_path)


# Load VAPID configuration from environment
_vapid_config = VAPIDConfig(
    public_key=os.getenv("VAPID_PUBLIC_KEY", ""),
    private_key=os.getenv("VAPID_PRIVATE_KEY", ""),
    mailto=os.getenv("VAPID_MAILTO", "mailto:admin@mediremind.app"),
    private_key_path=os.getenv("VAPID_PRIVATE_KEY_PATH", "")
)


class PushNotificationError(NotificationError):
    """Raised when push notification delivery fails."""
    def __init__(self, endpoint: str, details: Optional[str] = None):
        super().__init__(f"Failed to send push to {endpoint[:50]}...", details)


def get_vapid_public_key() -> str:
    """
    Get the VAPID public key for frontend subscription.
    
    Returns:
        The public key string, or empty if not configured
    """
    return _vapid_config.public_key


def send_push_notification(
    endpoint: str,
    p256dh_key: str,
    auth_key: str,
    title: str,
    body: str,
    icon: Optional[str] = None,
    url: Optional[str] = None,
    tag: Optional[str] = None
) -> bool:
    """
    Send a Web Push notification to a browser.
    
    Args:
        endpoint: Push service URL from subscription
        p256dh_key: Client's public key
        auth_key: Client's auth secret
        title: Notification title
        body: Notification body text
        icon: Optional icon URL
        url: Optional click action URL
        tag: Optional tag for notification grouping
    
    Returns:
        True if sent successfully
    
    Raises:
        PushNotificationError: If sending fails
    """
    if not _vapid_config.is_configured:
        logger.warning("VAPID keys not configured - skipping push notification")
        logger.info(f"[MOCK PUSH] Title: {title}, Body: {body}")
        return False
    
    subscription_info = {
        "endpoint": endpoint,
        "keys": {
            "p256dh": p256dh_key,
            "auth": auth_key
        }
    }
    
    payload = {
        "title": title,
        "body": body,
        "icon": icon or "/icons/pill-icon.png",
        "badge": "/icons/badge.png",
        "tag": tag or "medication-reminder",
        "data": {
            "url": url or "/"
        }
    }
    
    try:
        webpush(
            subscription_info=subscription_info,
            data=json.dumps(payload),
            vapid_private_key=_vapid_config.private_key,
            vapid_claims={
                "sub": _vapid_config.mailto
            }
        )
        logger.info(f"Push notification sent: {title}")
        return True
        
    except WebPushException as e:
        # Handle specific error codes
        if e.response and e.response.status_code == 410:
            # Subscription expired/unsubscribed - should be removed from DB
            logger.warning(f"Push subscription expired (410): {endpoint[:50]}...")
            raise PushNotificationError(endpoint, "Subscription expired")
        elif e.response and e.response.status_code == 404:
            logger.warning(f"Push subscription not found (404): {endpoint[:50]}...")
            raise PushNotificationError(endpoint, "Subscription not found")
        else:
            logger.error(f"Push notification failed: {e}")
            raise PushNotificationError(endpoint, str(e))
    except Exception as e:
        logger.error(f"Unexpected push error: {e}")
        raise PushNotificationError(endpoint, str(e))


def generate_vapid_keys() -> dict:
    """
    Generate a new VAPID key pair.
    
    Returns:
        Dict with 'public_key' and 'private_key'
    
    Note:
        Run this once and save the keys to your .env file.
    """
    from py_vapid import Vapid
    vapid = Vapid()
    vapid.generate_keys()
    return {
        "public_key": vapid.public_key,
        "private_key": vapid.private_key
    }


if __name__ == "__main__":
    # Utility to generate VAPID keys
    print("Generating VAPID keys...")
    keys = generate_vapid_keys()
    print(f"\nVAPID_PUBLIC_KEY={keys['public_key']}")
    print(f"VAPID_PRIVATE_KEY={keys['private_key']}")
    print("\nAdd these to your .env file!")
