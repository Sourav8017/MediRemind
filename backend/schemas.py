"""
Pydantic schemas with validation for API requests.
Includes input validation for security (size limits, format checks).
"""
import base64
import re
from typing import Optional

from pydantic import BaseModel, Field, field_validator


# --- CONSTANTS ---
MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024  # 5 MB
ALLOWED_IMAGE_FORMATS = {"image/jpeg", "image/png", "image/jpg", "image/webp"}


# --- IMAGE REQUEST WITH VALIDATION ---
class ImageRequest(BaseModel):
    """
    Request schema for image-based endpoints.
    Validates Base64 image size and format.
    """
    image: str = Field(..., description="Base64 encoded image string")
    
    @field_validator('image')
    @classmethod
    def validate_image(cls, v: str) -> str:
        """Validate image size and format."""
        if not v:
            raise ValueError("Image data is required")
        
        # Handle data URI format: "data:image/png;base64,..."
        if v.startswith("data:"):
            # Extract MIME type and base64 data
            match = re.match(r'data:([^;]+);base64,(.+)', v)
            if not match:
                raise ValueError("Invalid data URI format")
            
            mime_type, base64_data = match.groups()
            
            # Validate MIME type
            if mime_type.lower() not in ALLOWED_IMAGE_FORMATS:
                raise ValueError(
                    f"Invalid image format: {mime_type}. "
                    f"Allowed formats: JPEG, PNG, WebP"
                )
        else:
            # Assume raw base64 without data URI prefix
            base64_data = v
        
        # Validate base64 size (before decoding)
        # Base64 is ~33% larger than binary, so 5MB binary ≈ 6.67MB base64
        max_base64_size = int(MAX_IMAGE_SIZE_BYTES * 1.4)
        if len(base64_data) > max_base64_size:
            raise ValueError(
                f"Image too large. Maximum size is {MAX_IMAGE_SIZE_BYTES // (1024*1024)}MB"
            )
        
        # Validate it's valid base64
        try:
            decoded = base64.b64decode(base64_data)
            actual_size = len(decoded)
            if actual_size > MAX_IMAGE_SIZE_BYTES:
                raise ValueError(
                    f"Image too large ({actual_size // (1024*1024)}MB). "
                    f"Maximum size is {MAX_IMAGE_SIZE_BYTES // (1024*1024)}MB"
                )
        except Exception as e:
            if "Image too large" in str(e):
                raise
            raise ValueError(f"Invalid base64 image data: {str(e)}")
        
        return v


# --- MEDICATION SCHEMAS ---
class MedicationCreate(BaseModel):
    """Schema for creating a new medication."""
    name: str = Field(..., min_length=1, max_length=200)
    dosage: str = Field(..., min_length=1, max_length=100)
    frequency: str = Field(..., min_length=1, max_length=100)
    instructions: str = Field(default="Take as directed", max_length=500)
    start_date: str
    end_date: Optional[str] = None
    reminders: list[str] = Field(..., min_length=1, max_length=10)
    
    @field_validator('reminders')
    @classmethod
    def validate_reminders(cls, v: list[str]) -> list[str]:
        """Validate reminder times are in HH:MM format."""
        time_pattern = re.compile(r'^([01]?[0-9]|2[0-3]):([0-5][0-9])$')
        for t in v:
            if not time_pattern.match(t):
                raise ValueError(f"Invalid time format: {t}. Use HH:MM (24-hour)")
        return v


class MedicationResponse(BaseModel):
    """Response schema for OCR-extracted medication."""
    name: str
    dosage: str
    frequency: str
    instructions: str


# --- HEALTH DATA SCHEMAS ---
class HealthDataRequest(BaseModel):
    """Request schema for health risk prediction."""
    age: int = Field(..., ge=1, le=120, description="Age in years")
    gender: str = Field(..., min_length=1, max_length=20)
    systolicBP: int = Field(..., ge=60, le=250, description="Systolic blood pressure")
    diastolicBP: int = Field(..., ge=40, le=150, description="Diastolic blood pressure")
    heartRate: int = Field(..., ge=30, le=220, description="Heart rate BPM")
    weight: float = Field(..., ge=10, le=500, description="Weight in kg")
    height: float = Field(..., ge=50, le=300, description="Height in cm")
    smokingStatus: str = Field(..., max_length=50)
    diabetesStatus: str = Field(..., max_length=50)
    familyHistory: list[str] = Field(default_factory=list, max_length=20)
    currentMedications: list[str] = Field(default_factory=list, max_length=50)
    recentSymptoms: list[str] = Field(default_factory=list, max_length=30)


# --- NOTIFICATION SCHEMAS ---
class SubscriptionRequest(BaseModel):
    """Schema for Web Push subscription registration."""
    endpoint: str = Field(..., min_length=10, max_length=2000)
    keys: dict = Field(...)
    
    @field_validator('keys')
    @classmethod
    def validate_keys(cls, v: dict) -> dict:
        """Ensure required keys are present."""
        if 'p256dh' not in v or 'auth' not in v:
            raise ValueError("Subscription keys must include 'p256dh' and 'auth'")
        return v
