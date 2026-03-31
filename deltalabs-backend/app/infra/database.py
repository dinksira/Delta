"""MongoDB (Motor) client lifecycle and FastAPI database dependency."""

from collections.abc import AsyncGenerator
from typing import Any

from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase

from app.core.config import get_settings

MongoDoc = dict[str, Any]

_client: AsyncIOMotorClient[MongoDoc] | None = None


async def connect_mongodb() -> None:
    """Create the shared Motor client (idempotent)."""
    global _client
    if _client is not None:
        return
    settings = get_settings()
    _client = AsyncIOMotorClient(
        settings.mongodb_uri,
        maxPoolSize=settings.mongodb_max_pool_size,
        minPoolSize=settings.mongodb_min_pool_size,
        serverSelectionTimeoutMS=settings.mongodb_server_selection_timeout_ms,
    )


def disconnect_mongodb() -> None:
    """Close the Motor client."""
    global _client
    if _client is not None:
        _client.close()
        _client = None


def get_motor_client() -> AsyncIOMotorClient[MongoDoc]:
    """Return the process-wide Motor client."""
    if _client is None:
        msg = "MongoDB client is not initialized; ensure application lifespan has started."
        raise RuntimeError(msg)
    return _client


def get_database() -> AsyncIOMotorDatabase[MongoDoc]:
    """Return the configured application database."""
    settings = get_settings()
    return get_motor_client()[settings.mongodb_db_name]


async def get_db() -> AsyncGenerator[AsyncIOMotorDatabase[MongoDoc], None]:
    """FastAPI dependency: yield the application database."""
    yield get_database()
