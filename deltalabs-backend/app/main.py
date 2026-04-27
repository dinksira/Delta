import logging
from collections.abc import AsyncIterator, Awaitable, Callable
from contextlib import asynccontextmanager
from time import perf_counter
from typing import Any
from uuid import uuid4

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.middleware.cors import CORSMiddleware
from starlette.responses import Response

from app.api.v1 import api_router
from app.core import metrics as http_metrics
from app.core.config import get_settings
from app.core.exceptions import (
    # ################################ APPLICATION ################################
    ConflictError,
    DeltaLabsBaseError,
    NotFoundError,
    PermissionDeniedError,
    RateLimitError,
    ValidationError,
)
from app.core.logging import configure_logging
from app.core.rate_limit import enforce_auth_post_rate_limit
from app.core.readiness import run_readiness_checks
from app.infra.database import connect_mongodb, disconnect_mongodb
from app.infra.http_client import connect_http_client, disconnect_http_client
from app.infra.redis_client import connect_redis, disconnect_redis

_settings = get_settings()
configure_logging(_settings.log_level)
logger = logging.getLogger("deltalabs.api")


@asynccontextmanager
async def lifespan(_app: FastAPI) -> AsyncIterator[None]:
    await connect_mongodb()
    await connect_redis()
    await connect_http_client()
    try:
        yield
    finally:
        await disconnect_http_client()
        await disconnect_redis()
        disconnect_mongodb()


app = FastAPI(
    title=_settings.app_name,
    version=_settings.api_version,
    description=(
        "Delta Labs backend - foundation phase (FastAPI + MongoDB + Redis per backend standards)."
    ),
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=_settings.cors_origin_list(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _request_id(request: Request) -> str:
    request_id = getattr(request.state, "request_id", None)
    return request_id if isinstance(request_id, str) and request_id else str(uuid4())


def _error_payload(
    *,
    code: str,
    message: str,
    request_id: str,
    details: dict[str, Any] | list[dict[str, Any]] | None = None,
) -> dict[str, Any]:
    return {
        "code": code,
        "message": message,
        "requestId": request_id,
        "details": details,
    }


@app.middleware("http")
async def request_id_middleware(
    request: Request,
    call_next: Callable[[Request], Awaitable[Response]],
) -> Response:
    request_id = request.headers.get("X-Request-Id", str(uuid4()))
    request.state.request_id = request_id

    response = await call_next(request)
    response.headers["X-Request-Id"] = request_id
    return response


@app.middleware("http")
async def idempotency_middleware(
    request: Request,
    call_next: Callable[[Request], Awaitable[Response]],
) -> Response:
    idempotency_key = request.headers.get(_settings.idempotency_header_name)
    if isinstance(idempotency_key, str) and idempotency_key.strip():
        # Foundation placeholder: full response persistence in Redis lands later.
        request.state.idempotency_key = idempotency_key.strip()

    response = await call_next(request)
    if hasattr(request.state, "idempotency_key"):
        response.headers[_settings.idempotency_header_name] = request.state.idempotency_key
    return response


@app.middleware("http")
async def auth_rate_limit_middleware(
    request: Request,
    call_next: Callable[[Request], Awaitable[Response]],
) -> Response:
    try:
        await enforce_auth_post_rate_limit(request)
    except RateLimitError as exc:
        payload = _error_payload(
            code=exc.code,
            message=exc.message,
            request_id=_request_id(request),
            details=exc.details,
        )
        return JSONResponse(status_code=429, content=payload)
    return await call_next(request)


@app.middleware("http")
async def request_logging_middleware(
    request: Request,
    call_next: Callable[[Request], Awaitable[Response]],
) -> Response:
    start = perf_counter()
    response = await call_next(request)
    http_metrics.record_request(status_code=response.status_code)
    duration_ms = int((perf_counter() - start) * 1000)
    logger.info(
        "request.complete",
        extra={
            "request_id": _request_id(request),
            "status_code": response.status_code,
            "duration_ms": duration_ms,
            "path": request.url.path,
            "method": request.method,
        },
    )
    return response


@app.exception_handler(DeltaLabsBaseError)
async def handle_domain_error(request: Request, exc: DeltaLabsBaseError) -> JSONResponse:
    status_code = 400
    if isinstance(exc, NotFoundError):
        status_code = 404
    elif isinstance(exc, ConflictError):
        status_code = 409
    elif isinstance(exc, PermissionDeniedError):
        status_code = 403
    elif isinstance(exc, RateLimitError):
        status_code = 429
    elif isinstance(exc, ValidationError):
        status_code = 400

    payload = _error_payload(
        code=exc.code,
        message=exc.message,
        request_id=_request_id(request),
        details=exc.details,
    )
    return JSONResponse(status_code=status_code, content=payload)


@app.exception_handler(RequestValidationError)
async def handle_request_validation_error(
    request: Request,
    exc: RequestValidationError,
) -> JSONResponse:
    payload = _error_payload(
        code="request_validation_error",
        message="Request validation failed.",
        request_id=_request_id(request),
        details=[dict(item) for item in exc.errors()],
    )
    return JSONResponse(status_code=400, content=payload)


@app.exception_handler(Exception)
async def handle_unexpected_error(request: Request, exc: Exception) -> JSONResponse:
    message = "Internal server error."
    if _settings.env == "local":
        message = str(exc)
    payload = _error_payload(
        code="internal_server_error",
        message=message,
        request_id=_request_id(request),
        details=None,
    )
    return JSONResponse(status_code=500, content=payload)


@app.get("/health")
async def health() -> JSONResponse:
    """Liveness: process is up (no dependency checks)."""
    return JSONResponse({"status": "ok"})


@app.get("/ready")
async def ready() -> JSONResponse:
    """Readiness: MongoDB and Redis must respond."""
    ok, detail = await run_readiness_checks()
    body = {"status": "ready" if ok else "not_ready", "checks": detail}
    return JSONResponse(status_code=200 if ok else 503, content=body)


app.include_router(api_router, prefix=_settings.api_v1_prefix)
# ################################ /APPLICATION ################################
