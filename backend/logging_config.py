"""
Centralized logging configuration for the MediRemind backend.
Provides structured logging with console and file output.
"""
import logging
import sys
from logging.handlers import RotatingFileHandler
from typing import Optional
from pathlib import Path


# Log format with timestamp, level, module, and message
LOG_FORMAT = "%(asctime)s | %(levelname)-8s | %(name)s | %(message)s"
DATE_FORMAT = "%Y-%m-%d %H:%M:%S"

# Log directory (relative to backend/)
LOG_DIR = Path(__file__).parent / "logs"


def setup_logger(
    name: str,
    level: int = logging.INFO,
    log_to_file: bool = True,
    log_file: Optional[str] = None
) -> logging.Logger:
    """
    Create and configure a logger instance.
    
    Args:
        name: Logger name (typically __name__ of the calling module)
        level: Logging level (default: INFO)
        log_to_file: Whether to also log to a file
        log_file: Custom log file name (default: app.log)
    
    Returns:
        Configured logger instance
    """
    logger = logging.getLogger(name)
    
    # Avoid adding duplicate handlers
    if logger.handlers:
        return logger
    
    logger.setLevel(level)
    
    # Console Handler (stdout)
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(level)
    console_handler.setFormatter(logging.Formatter(LOG_FORMAT, DATE_FORMAT))
    logger.addHandler(console_handler)
    
    # File Handler (rotating)
    if log_to_file:
        try:
            LOG_DIR.mkdir(exist_ok=True)
            file_path = LOG_DIR / (log_file or "app.log")
            file_handler = RotatingFileHandler(
                file_path,
                maxBytes=5 * 1024 * 1024,  # 5 MB
                backupCount=3,
                encoding="utf-8"
            )
            file_handler.setLevel(level)
            file_handler.setFormatter(logging.Formatter(LOG_FORMAT, DATE_FORMAT))
            logger.addHandler(file_handler)
        except (OSError, PermissionError) as e:
            # Fallback to console only if file logging fails (e.g., Read-only FS)
            sys.stderr.write(f"Warning: Failed to setup file logging: {e}\n")
    
    return logger


# Pre-configured loggers for common modules
def get_api_logger() -> logging.Logger:
    """Logger for API endpoints."""
    return setup_logger("mediremind.api")


def get_auth_logger() -> logging.Logger:
    """Logger for authentication operations."""
    return setup_logger("mediremind.auth")


def get_worker_logger() -> logging.Logger:
    """Logger for background worker."""
    return setup_logger("mediremind.worker")


def get_notification_logger() -> logging.Logger:
    """Logger for notification service."""
    return setup_logger("mediremind.notifications")


def get_db_logger() -> logging.Logger:
    """Logger for database operations."""
    return setup_logger("mediremind.database")
