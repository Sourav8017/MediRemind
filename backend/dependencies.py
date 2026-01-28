"""
FastAPI dependencies for the MediRemind application.
Provides injectable dependencies for database and AI services.
"""
from functools import lru_cache
from typing import Optional
import os

import chromadb
from chromadb.api.models.Collection import Collection

from logging_config import get_db_logger

# Initialize logger
logger = get_db_logger()

# ChromaDB configuration
CHROMA_DB_PATH = os.path.join(os.path.dirname(__file__), "..", "medical_db")
COLLECTION_NAME = "nlem_2022_grounding"


@lru_cache(maxsize=1)
def get_chroma_client() -> Optional[chromadb.ClientAPI]:
    """
    Singleton connection to ChromaDB.
    
    Uses lru_cache to ensure only one client instance exists.
    
    Returns:
        ChromaDB PersistentClient or None if initialization fails
    """
    if not os.path.exists(CHROMA_DB_PATH):
        logger.warning(f"Medical DB path not found: {CHROMA_DB_PATH}")
    
    try:
        client = chromadb.PersistentClient(path=CHROMA_DB_PATH)
        logger.info("ChromaDB client initialized successfully")
        return client
    except Exception as e:
        logger.error(f"Failed to initialize ChromaDB client: {e}")
        return None


def get_medical_collection() -> Optional[Collection]:
    """
    FastAPI dependency to get the NLEM 2022 collection.
    
    Usage:
        @app.get("/endpoint")
        def handler(collection = Depends(get_medical_collection)):
            ...
    
    Returns:
        ChromaDB Collection or None if unavailable
    """
    client = get_chroma_client()
    if client is None:
        logger.error("ChromaDB client unavailable")
        return None
    
    try:
        collection = client.get_collection(name=COLLECTION_NAME)
        logger.debug(f"Retrieved collection '{COLLECTION_NAME}'")
        return collection
    except ValueError:
        logger.warning(f"Collection '{COLLECTION_NAME}' not found. Run ingest script.")
        return None
    except Exception as e:
        logger.error(f"Error retrieving collection: {e}")
        return None
