"""Infrastructure client wiring (Mongo, Redis, httpx)."""

import pytest
from app.infra.database import get_database, get_motor_client
from app.infra.http_client import get_async_http_client
from app.infra.redis_client import get_redis_client
from app.main import app
from fastapi.testclient import TestClient
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase


def test_shared_clients_require_lifespan() -> None:
    with pytest.raises(RuntimeError, match="MongoDB client is not initialized"):
        get_motor_client()
    with pytest.raises(RuntimeError, match="Redis client is not initialized"):
        get_redis_client()
    with pytest.raises(RuntimeError, match="HTTP client is not initialized"):
        get_async_http_client()


def test_lifespan_exposes_typed_clients() -> None:
    with TestClient(app):
        assert isinstance(get_motor_client(), AsyncIOMotorClient)
        assert isinstance(get_database(), AsyncIOMotorDatabase)
        assert get_redis_client() is not None
        assert get_async_http_client() is not None
