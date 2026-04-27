from __future__ import annotations

from fastapi import APIRouter, Depends, Header, HTTPException, Request, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.api.deps import get_db, get_redis
from app.compat.redis_typing import AsyncRedis
from app.core.config import get_settings
from app.domain.identity.recover_service import RecoverService
from app.domain.identity.repository import Repository
from app.domain.identity.schemas import (
    AuthIssuedResponse,
    AuthSuccessResponse,
    LoginRequest,
    LogoutResponse,
    RecoverRequest,
    RecoverRequestResponse,
    RecoverResetRequest,
    RecoverResetResponse,
    RecoverVerifyRequest,
    RecoverVerifyResponse,
    SignupCompleteRequest,
    SignupFlowStateResponse,
    SignupInitRequest,
    SignupStepContactRequest,
    SignupStepDobRequest,
    SignupStepIdentityRequest,
    SignupStepVerificationRequest,
    VerificationResendRequest,
    VerificationSendRequest,
    VerificationSendResponse,
    VerificationVerifyRequest,
    VerificationVerifyResponse,
)
from app.domain.identity.service import Service
from app.domain.identity.signup_flow_service import SignupFlowService
from app.domain.identity.verification_service import VerificationService

# ################################ CONSTANTS ################################
# Router and dependency aliases for auth and signup orchestration.
router = APIRouter(prefix="/auth", tags=["auth"])

RedisDep = AsyncRedis
# ################################ /CONSTANTS ################################


# ################################ HELPERS ################################
# Internal factories and token parsing helpers.
def _extract_bearer_token(authorization: str | None) -> str:
    if authorization is None or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "unauthenticated", "message": "Missing bearer token."},
        )
    token = authorization[len("Bearer ") :].strip()
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "unauthenticated", "message": "Missing bearer token."},
        )
    return token


def _service(db: AsyncIOMotorDatabase[dict[str, object]]) -> Service:
    return Service(Repository(db))


def _verification_service(redis: RedisDep) -> VerificationService:
    return VerificationService(redis)


def _signup_flow_service(
    db: AsyncIOMotorDatabase[dict[str, object]],
    redis: RedisDep,
) -> SignupFlowService:
    return SignupFlowService(
        repository=Repository(db),
        redis=redis,
        session_ttl_minutes=get_settings().access_token_expire_minutes,
    )


def _recover_service(
    db: AsyncIOMotorDatabase[dict[str, object]],
    redis: RedisDep,
) -> RecoverService:
    return RecoverService(repository=Repository(db), redis=redis)


# ################################ /HELPERS ################################


# ################################ ROUTES ################################
# Auth lifecycle, verification, signup flow, and recover endpoints.
@router.post("/signup/init", response_model=AuthIssuedResponse)
async def signup_init(
    payload: SignupInitRequest,
    db: AsyncIOMotorDatabase[dict[str, object]] = Depends(get_db),  # noqa: B008
) -> AuthIssuedResponse:
    service = _service(db)
    await service.bootstrap_indexes()
    return await service.signup_init(payload)


@router.post("/login", response_model=AuthIssuedResponse)
async def login(
    payload: LoginRequest,
    db: AsyncIOMotorDatabase[dict[str, object]] = Depends(get_db),  # noqa: B008
) -> AuthIssuedResponse:
    service = _service(db)
    await service.bootstrap_indexes()
    return await service.login(payload)


@router.get("/session", response_model=AuthSuccessResponse)
async def get_session(
    authorization: str | None = Header(default=None, alias="Authorization"),
    db: AsyncIOMotorDatabase[dict[str, object]] = Depends(get_db),  # noqa: B008
) -> AuthSuccessResponse:
    service = _service(db)
    return await service.session_from_token(_extract_bearer_token(authorization))


@router.post("/logout", response_model=LogoutResponse)
async def logout(
    authorization: str | None = Header(default=None, alias="Authorization"),
    db: AsyncIOMotorDatabase[dict[str, object]] = Depends(get_db),  # noqa: B008
) -> LogoutResponse:
    service = _service(db)
    await service.logout(_extract_bearer_token(authorization))
    return LogoutResponse()


@router.post("/verification/send", response_model=VerificationSendResponse)
async def verification_send(
    payload: VerificationSendRequest,
    request: Request,
    redis: RedisDep = Depends(get_redis),  # noqa: B008
) -> VerificationSendResponse:
    service = _verification_service(redis)
    ip_address = request.client.host if request.client is not None else "unknown"
    return await service.send_code(payload, ip_address=ip_address)


@router.post("/verification/verify", response_model=VerificationVerifyResponse)
async def verification_verify(
    payload: VerificationVerifyRequest,
    redis: RedisDep = Depends(get_redis),  # noqa: B008
) -> VerificationVerifyResponse:
    service = _verification_service(redis)
    return await service.verify_code(payload)


@router.post("/verification/resend", response_model=VerificationSendResponse)
async def verification_resend(
    payload: VerificationResendRequest,
    request: Request,
    redis: RedisDep = Depends(get_redis),  # noqa: B008
) -> VerificationSendResponse:
    service = _verification_service(redis)
    ip_address = request.client.host if request.client is not None else "unknown"
    return await service.resend_code(payload.verification_id, ip_address=ip_address)


@router.post("/signup/step/identity", response_model=SignupFlowStateResponse)
async def signup_step_identity(
    payload: SignupStepIdentityRequest,
    db: AsyncIOMotorDatabase[dict[str, object]] = Depends(get_db),  # noqa: B008
    redis: RedisDep = Depends(get_redis),  # noqa: B008
) -> SignupFlowStateResponse:
    flow_service = _signup_flow_service(db, redis)
    return await flow_service.step_identity(payload)


@router.post("/signup/step/contact", response_model=SignupFlowStateResponse)
async def signup_step_contact(
    payload: SignupStepContactRequest,
    db: AsyncIOMotorDatabase[dict[str, object]] = Depends(get_db),  # noqa: B008
    redis: RedisDep = Depends(get_redis),  # noqa: B008
) -> SignupFlowStateResponse:
    flow_service = _signup_flow_service(db, redis)
    return await flow_service.step_contact(payload)


@router.post("/signup/step/verification", response_model=SignupFlowStateResponse)
async def signup_step_verification(
    payload: SignupStepVerificationRequest,
    db: AsyncIOMotorDatabase[dict[str, object]] = Depends(get_db),  # noqa: B008
    redis: RedisDep = Depends(get_redis),  # noqa: B008
) -> SignupFlowStateResponse:
    flow_service = _signup_flow_service(db, redis)
    return await flow_service.step_verification(payload)


@router.post("/signup/step/dob", response_model=SignupFlowStateResponse)
async def signup_step_dob(
    payload: SignupStepDobRequest,
    db: AsyncIOMotorDatabase[dict[str, object]] = Depends(get_db),  # noqa: B008
    redis: RedisDep = Depends(get_redis),  # noqa: B008
) -> SignupFlowStateResponse:
    flow_service = _signup_flow_service(db, redis)
    return await flow_service.step_dob(payload)


@router.post("/signup/complete", response_model=AuthIssuedResponse)
async def signup_complete(
    payload: SignupCompleteRequest,
    db: AsyncIOMotorDatabase[dict[str, object]] = Depends(get_db),  # noqa: B008
    redis: RedisDep = Depends(get_redis),  # noqa: B008
) -> AuthIssuedResponse:
    flow_service = _signup_flow_service(db, redis)
    return await flow_service.complete(payload)


@router.get("/signup/state", response_model=SignupFlowStateResponse)
async def signup_state(
    flow_id: str,
    db: AsyncIOMotorDatabase[dict[str, object]] = Depends(get_db),  # noqa: B008
    redis: RedisDep = Depends(get_redis),  # noqa: B008
) -> SignupFlowStateResponse:
    flow_service = _signup_flow_service(db, redis)
    return await flow_service.state(flow_id)


@router.post("/recover/request", response_model=RecoverRequestResponse)
async def recover_request(
    payload: RecoverRequest,
    request: Request,
    db: AsyncIOMotorDatabase[dict[str, object]] = Depends(get_db),  # noqa: B008
    redis: RedisDep = Depends(get_redis),  # noqa: B008
) -> RecoverRequestResponse:
    service = _recover_service(db, redis)
    ip_address = request.client.host if request.client is not None else "unknown"
    return await service.request_recover(payload, ip_address=ip_address)


@router.post("/recover/verify", response_model=RecoverVerifyResponse)
async def recover_verify(
    payload: RecoverVerifyRequest,
    db: AsyncIOMotorDatabase[dict[str, object]] = Depends(get_db),  # noqa: B008
    redis: RedisDep = Depends(get_redis),  # noqa: B008
) -> RecoverVerifyResponse:
    service = _recover_service(db, redis)
    return await service.verify_recover(payload)


@router.post("/recover/reset", response_model=RecoverResetResponse)
async def recover_reset(
    payload: RecoverResetRequest,
    db: AsyncIOMotorDatabase[dict[str, object]] = Depends(get_db),  # noqa: B008
    redis: RedisDep = Depends(get_redis),  # noqa: B008
) -> RecoverResetResponse:
    service = _recover_service(db, redis)
    return await service.reset_password(payload)


# ################################ /ROUTES ################################
