"""
Authentication utilities for JWT token management.
Implements secure password hashing and token-based authentication.
"""
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
import os

from database import get_db
import models
from logging_config import get_auth_logger
from exceptions import InvalidTokenError, UserNotFoundError

# Initialize logger
logger = get_auth_logger()

# --- Configuration ---
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "your-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Password hashing (pbkdf2_sha256 for cross-platform compatibility)
pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")

# OAuth2 scheme
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/token")


# --- Pydantic Schemas ---

class Token(BaseModel):
    """JWT token response schema."""
    access_token: str
    token_type: str


class TokenData(BaseModel):
    """Decoded token data."""
    email: Optional[str] = None


class UserCreate(BaseModel):
    """User registration schema."""
    email: EmailStr  # Validates email format
    password: str


class UserResponse(BaseModel):
    """User response schema (public fields only)."""
    id: int
    email: str
    is_active: bool
    full_name: Optional[str] = None
    phone_number: Optional[str] = None
    email_notifications: bool = False

    class Config:
        from_attributes = True


class UserUpdate(BaseModel):
    """User profile update schema."""
    full_name: Optional[str] = None
    phone_number: Optional[str] = None
    email_notifications: Optional[bool] = None


# --- Utility Functions ---

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain password against its hash."""
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """Generate a secure hash for a password."""
    return pwd_context.hash(password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    Create a JWT access token.
    
    Args:
        data: Payload data (should include 'sub' for subject)
        expires_delta: Optional custom expiration time
    
    Returns:
        Encoded JWT string
    """
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    logger.debug(f"Created access token for {data.get('sub', 'unknown')}")
    return encoded_jwt


def get_user_by_email(db: Session, email: str) -> Optional[models.User]:
    """
    Retrieve a user by email address.
    
    Args:
        db: Database session
        email: User's email address
    
    Returns:
        User model instance or None
    """
    return db.query(models.User).filter(models.User.email == email).first()


def authenticate_user(db: Session, email: str, password: str) -> Optional[models.User]:
    """
    Authenticate a user with email and password.
    
    Args:
        db: Database session
        email: User's email address
        password: Plain text password
    
    Returns:
        User model if authentication succeeds, None otherwise
    """
    user = get_user_by_email(db, email)
    if not user:
        logger.warning(f"Authentication failed: user not found for {email}")
        return None
    if not verify_password(password, user.hashed_password):
        logger.warning(f"Authentication failed: invalid password for {email}")
        return None
    logger.info(f"User authenticated successfully: {email}")
    return user


def _decode_jwt_token(token: str) -> str:
    """
    Decode and validate a JWT token.
    
    Args:
        token: JWT token string
    
    Returns:
        Email address from token payload
    
    Raises:
        HTTPException: If token is invalid or expired
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: Optional[str] = payload.get("sub")
        if email is None:
            logger.warning("Token missing 'sub' claim")
            raise credentials_exception
        return email
    except JWTError as e:
        logger.warning(f"JWT decode error: {e}")
        raise credentials_exception


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> models.User:
    """
    FastAPI dependency to get the current authenticated user.
    
    Args:
        token: JWT token from Authorization header
        db: Database session
    
    Returns:
        Authenticated user model
    
    Raises:
        HTTPException: If authentication fails
    """
    email = _decode_jwt_token(token)
    user = get_user_by_email(db, email=email)
    if user is None:
        logger.warning(f"User not found for token email: {email}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user


async def get_current_user_from_token(token: str, db: Session) -> models.User:
    """
    Validate token passed as query parameter (for SSE endpoints).
    
    Args:
        token: JWT token string
        db: Database session
    
    Returns:
        Authenticated user model
    
    Raises:
        HTTPException: If authentication fails
    """
    email = _decode_jwt_token(token)
    user = get_user_by_email(db, email=email)
    if user is None:
        logger.warning(f"SSE auth failed: user not found for {email}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
        )
    return user
