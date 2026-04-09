"""Dependency injection tests for app.api.deps."""

from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from app.api.deps import get_current_user, get_db, get_redis
from app.infra.database import connect_mongodb, disconnect_mongodb
from app.infra.http_client import connect_http_client, disconnect_http_client
from app.infra.redis_client import connect_redis, disconnect_redis
from fastapi import Depends, FastAPI
from fastapi.testclient import TestClient


@asynccontextmanager
async def app_lifespan(_app: FastAPI) -> AsyncIterator[None]:
    await connect_mongodb()
    await connect_redis()
    await connect_http_client()
    try:
        yield
    finally:
        await disconnect_http_client()
        await disconnect_redis()
        disconnect_mongodb()


def build_test_app() -> FastAPI:
    app = FastAPI(lifespan=app_lifespan)
    db_dep = Depends(get_db)
    redis_dep = Depends(get_redis)
    current_user_dep = Depends(get_current_user)

    @app.get("/deps")
    async def deps_route(
        db=db_dep,
        redis=redis_dep,
    ) -> dict[str, bool]:
        return {"db": db is not None, "redis": redis is not None}

    @app.get("/auth")
    async def auth_route(_user=current_user_dep) -> dict[str, str]:
        return {"status": "ok"}

    return app


def test_get_db_and_redis_dependencies() -> None:
    app = build_test_app()
    with TestClient(app) as client:
        response = client.get("/deps")
    assert response.status_code == 200
    assert response.json() == {"db": True, "redis": True}


def test_get_current_user_placeholder_returns_401() -> None:
    app = build_test_app()
    with TestClient(app) as client:
        response = client.get("/auth")
    assert response.status_code == 401
    assert response.json()["detail"]["code"] == "unauthenticated"


# ################################ MODULE ################################
# ################################ /MODULE ################################
