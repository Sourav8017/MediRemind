"""
Custom exceptions for the MediRemind application.
Provides a hierarchy of domain-specific exceptions for better error handling.
"""
from typing import Optional


class MediRemindException(Exception):
    """
    Base exception for all application-specific errors.
    
    Attributes:
        message: Human-readable error description
        details: Optional additional context
    """
    def __init__(self, message: str, details: Optional[str] = None):
        self.message = message
        self.details = details
        super().__init__(self.message)
    
    def __str__(self) -> str:
        if self.details:
            return f"{self.message} | Details: {self.details}"
        return self.message


# --- Authentication Exceptions ---

class AuthenticationError(MediRemindException):
    """Raised when authentication fails (invalid credentials, expired token, etc.)."""
    pass


class TokenExpiredError(AuthenticationError):
    """Raised when a JWT token has expired."""
    def __init__(self, details: Optional[str] = None):
        super().__init__("Token has expired", details)


class InvalidTokenError(AuthenticationError):
    """Raised when a JWT token is malformed or invalid."""
    def __init__(self, details: Optional[str] = None):
        super().__init__("Invalid authentication token", details)


class UserNotFoundError(AuthenticationError):
    """Raised when a user cannot be found in the database."""
    def __init__(self, email: Optional[str] = None):
        details = f"Email: {email}" if email else None
        super().__init__("User not found", details)


# --- AI/External Service Exceptions ---

class AIServiceError(MediRemindException):
    """Raised when an AI service (Gemini) fails."""
    pass


class AIResponseParseError(AIServiceError):
    """Raised when the AI response cannot be parsed."""
    def __init__(self, raw_response: Optional[str] = None):
        details = f"Raw: {raw_response[:200]}..." if raw_response and len(raw_response) > 200 else raw_response
        super().__init__("Failed to parse AI response", details)


class AIQuotaExceededError(AIServiceError):
    """Raised when AI API quota is exceeded."""
    def __init__(self):
        super().__init__("AI service quota exceeded", "Falling back to rule-based analysis")


# --- Database Exceptions ---

class DatabaseError(MediRemindException):
    """Base exception for database operations."""
    pass


class RecordNotFoundError(DatabaseError):
    """Raised when a database record is not found."""
    def __init__(self, model: str, identifier: Optional[str] = None):
        details = f"ID: {identifier}" if identifier else None
        super().__init__(f"{model} not found", details)


class DuplicateRecordError(DatabaseError):
    """Raised when attempting to create a duplicate record."""
    def __init__(self, model: str, field: str, value: str):
        super().__init__(f"{model} already exists", f"{field}={value}")


# --- Notification Exceptions ---

class NotificationError(MediRemindException):
    """Base exception for notification failures."""
    pass


class EmailDeliveryError(NotificationError):
    """Raised when email delivery fails."""
    def __init__(self, recipient: str, details: Optional[str] = None):
        super().__init__(f"Failed to deliver email to {recipient}", details)


# --- Validation Exceptions ---

class ValidationError(MediRemindException):
    """Raised for input validation failures."""
    pass


class InvalidImageError(ValidationError):
    """Raised when image data is invalid or corrupt."""
    def __init__(self, details: Optional[str] = None):
        super().__init__("Invalid image data", details)
