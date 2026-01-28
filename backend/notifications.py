"""
Email notification service for medication reminders.
Supports both real SMTP delivery and mock logging for development.
"""
import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dataclasses import dataclass
from typing import Optional

from logging_config import get_notification_logger
from exceptions import EmailDeliveryError

# Initialize logger
logger = get_notification_logger()


@dataclass(frozen=True)
class SMTPConfig:
    """Immutable SMTP configuration."""
    server: str
    port: int
    username: str
    password: str
    from_email: str
    
    @property
    def is_configured(self) -> bool:
        """Check if SMTP credentials are provided."""
        return bool(self.username and self.password)


# Load configuration from environment
_smtp_config = SMTPConfig(
    server=os.getenv("SMTP_SERVER", "smtp.gmail.com"),
    port=int(os.getenv("SMTP_PORT", "587")),
    username=os.getenv("SMTP_USER", ""),
    password=os.getenv("SMTP_PASSWORD", ""),
    from_email=os.getenv("FROM_EMAIL", "noreply@mediremind.app")
)


def send_email(
    to_email: str,
    subject: str,
    body: str,
    html: bool = True
) -> bool:
    """
    Send an email notification.
    
    If SMTP credentials are not configured, the email is logged
    to the console for development/testing purposes.
    
    Args:
        to_email: Recipient email address
        subject: Email subject line
        body: Email body content
        html: Whether body is HTML (default: True)
    
    Returns:
        True if email was sent (or mocked) successfully
    
    Raises:
        EmailDeliveryError: If delivery fails with configured SMTP
    """
    if not _smtp_config.is_configured:
        _mock_send_email(to_email, subject, body)
        return True

    return _send_smtp_email(to_email, subject, body, html)


def _mock_send_email(to_email: str, subject: str, body: str) -> None:
    """Log email to console when SMTP is not configured."""
    logger.info("=" * 50)
    logger.info(f"[MOCK EMAIL] To: {to_email}")
    logger.info(f"Subject: {subject}")
    logger.info(f"Body: {body[:200]}..." if len(body) > 200 else f"Body: {body}")
    logger.info("=" * 50)


def _send_smtp_email(
    to_email: str,
    subject: str,
    body: str,
    html: bool = True
) -> bool:
    """
    Send email via SMTP.
    
    Args:
        to_email: Recipient email address
        subject: Email subject line
        body: Email body content
        html: Whether body is HTML
    
    Returns:
        True if sent successfully
    
    Raises:
        EmailDeliveryError: If sending fails
    """
    try:
        msg = MIMEMultipart()
        msg["From"] = _smtp_config.from_email
        msg["To"] = to_email
        msg["Subject"] = subject
        
        content_type = "html" if html else "plain"
        msg.attach(MIMEText(body, content_type))
        
        with smtplib.SMTP(_smtp_config.server, _smtp_config.port) as server:
            server.starttls()
            server.login(_smtp_config.username, _smtp_config.password)
            server.send_message(msg)
        
        logger.info(f"Email sent successfully to {to_email}")
        return True
        
    except smtplib.SMTPAuthenticationError as e:
        logger.error(f"SMTP authentication failed: {e}")
        raise EmailDeliveryError(to_email, "Authentication failed")
    except smtplib.SMTPRecipientsRefused as e:
        logger.error(f"Recipient refused: {e}")
        raise EmailDeliveryError(to_email, "Recipient refused")
    except smtplib.SMTPException as e:
        logger.error(f"SMTP error: {e}")
        raise EmailDeliveryError(to_email, str(e))
    except Exception as e:
        logger.error(f"Unexpected email error: {e}")
        raise EmailDeliveryError(to_email, str(e))
