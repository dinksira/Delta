"""Signup flow orchestration with resumable server-side state."""

from __future__ import annotations

import json
from datetime import UTC, datetime
from typing import TypedDict
from uuid import uuid4

from app.compat.redis_typing import AsyncRedis
from app.core.config import get_settings
from app.core.exceptions import ConflictError, ValidationError
from app.core.security import (
    hash_password,
    hash_session_token,
    issue_session_token,
    validate_password_policy,
)
from app.domain.identity.repository import Repository
from app.domain.identity.schemas import (
    AuthIssuedResponse,
    AuthUserPublic,
    SessionPublic,
    SignupCompleteRequest,
    SignupFlowStateResponse,
    SignupStepContactRequest,
    SignupStepDobRequest,
    SignupStepIdentityRequest,
    SignupStepVerificationRequest,
)

RedisDep = AsyncRedis


class SignupFlowService:
    """Coordinates step-by-step signup state and final user creation."""

    # ################################ SERVICE ################################
    def __init__(self, repository: Repository, redis: RedisDep, session_ttl_minutes: int) -> None:
        self._repository = repository
        self._redis = redis
        self._flow_ttl_seconds = 24 * 60 * 60
        self._session_ttl_minutes = session_ttl_minutes

    async def step_identity(self, payload: SignupStepIdentityRequest) -> SignupFlowStateResponse:
        existing = await self._repository.find_user_by_identity(payload.username)
        if existing is not None:
            raise ConflictError("Identity already exists.", code="identity_already_exists")

        flow_id = str(uuid4())
        state: SignupFlowState = {
            "flow_id": flow_id,
            "current_step": "identity",
            "completed_steps": ["identity"],
            "username": payload.username.strip(),
            "email": None,
            "phone_e164": None,
            "verification_id": None,
            "date_of_birth": None,
            "created_at_epoch": int(datetime.now(UTC).timestamp()),
        }
        await self._save_state(state)
        return self._public_state(state)

    async def step_contact(self, payload: SignupStepContactRequest) -> SignupFlowStateResponse:
        state = await self._load_state(payload.flow_id)
        self._require_step(state, expected="identity")
        if payload.email is None and payload.phone_e164 is None:
            raise ValidationError(
                "Either email or phone must be provided.",
                code="signup_contact_required",
            )

        if payload.email is not None:
            existing_email = await self._repository.find_user_by_identity(payload.email)
            if existing_email is not None:
                raise ConflictError("Identity already exists.", code="identity_already_exists")
            state["email"] = payload.email.strip()

        if payload.phone_e164 is not None:
            existing_phone = await self._repository.find_user_by_identity(payload.phone_e164)
            if existing_phone is not None:
                raise ConflictError("Identity already exists.", code="identity_already_exists")
            state["phone_e164"] = payload.phone_e164.strip()

        state["current_step"] = "contact"
        state["completed_steps"] = self._append_step(state["completed_steps"], "contact")
        await self._save_state(state)
        return self._public_state(state)

    async def step_verification(
        self,
        payload: SignupStepVerificationRequest,
    ) -> SignupFlowStateResponse:
        state = await self._load_state(payload.flow_id)
        self._require_step(state, expected="contact")

        verification_raw = await self._redis.get(f"otp:verification:{payload.verification_id}")
        if verification_raw is None:
            raise ValidationError(
                "Verification is missing or expired.", code="verification_expired"
            )

        verification_state = json.loads(verification_raw)
        if not bool(verification_state.get("used", False)):
            raise ValidationError(
                "Verification is not completed.", code="verification_not_completed"
            )

        destination = str(verification_state.get("destination", "")).strip()
        if destination not in {state["email"], state["phone_e164"]}:
            raise ValidationError(
                "Verification destination does not match contact step.",
                code="verification_mismatch",
            )

        state["verification_id"] = payload.verification_id
        state["current_step"] = "verification"
        state["completed_steps"] = self._append_step(state["completed_steps"], "verification")
        await self._save_state(state)
        return self._public_state(state)

    async def step_dob(self, payload: SignupStepDobRequest) -> SignupFlowStateResponse:
        state = await self._load_state(payload.flow_id)
        self._require_step(state, expected="verification")
        self._validate_dob(payload.date_of_birth)

        state["date_of_birth"] = payload.date_of_birth
        state["current_step"] = "dob"
        state["completed_steps"] = self._append_step(state["completed_steps"], "dob")
        await self._save_state(state)
        return self._public_state(state)

    async def complete(self, payload: SignupCompleteRequest) -> AuthIssuedResponse:
        state = await self._load_state(payload.flow_id)
        self._require_step(state, expected="dob")

        validate_password_policy(payload.password)
        user = await self._repository.create_user_with_password(
            username=state["username"],
            email=state["email"],
            phone_e164=state["phone_e164"],
            password_hash=hash_password(payload.password),
        )
        raw_token = issue_session_token()
        session_doc = await self._repository.create_session(
            user_id=user.id,
            token_hash=hash_session_token(raw_token),
            ttl_minutes=self._session_ttl_minutes,
            max_sessions=get_settings().max_sessions_per_user,
        )
        await self._redis.delete(self._flow_key(payload.flow_id))

        return AuthIssuedResponse(
            access_token=raw_token,
            session=SessionPublic(
                session_id=str(session_doc["_id"]),
                user_id=user.id,
                expires_at=session_doc["expires_at"],
            ),
            user=AuthUserPublic(
                user_id=user.id,
                username=user.username,
                email=user.email,
                phone_e164=user.phone_e164,
                is_verified=True,
            ),
        )

    async def state(self, flow_id: str) -> SignupFlowStateResponse:
        return self._public_state(await self._load_state(flow_id))

    async def _load_state(self, flow_id: str) -> SignupFlowState:
        raw = await self._redis.get(self._flow_key(flow_id))
        if raw is None:
            raise ValidationError("Signup flow is missing or expired.", code="signup_flow_expired")
        parsed = json.loads(raw)
        return SignupFlowState(
            flow_id=str(parsed["flow_id"]),
            current_step=str(parsed["current_step"]),
            completed_steps=[str(item) for item in parsed["completed_steps"]],
            username=str(parsed["username"]),
            email=str(parsed["email"]) if parsed["email"] is not None else None,
            phone_e164=str(parsed["phone_e164"]) if parsed["phone_e164"] is not None else None,
            verification_id=(
                str(parsed["verification_id"]) if parsed["verification_id"] is not None else None
            ),
            date_of_birth=str(parsed["date_of_birth"])
            if parsed["date_of_birth"] is not None
            else None,
            created_at_epoch=int(parsed["created_at_epoch"]),
        )

    async def _save_state(self, state: SignupFlowState) -> None:
        await self._redis.set(
            self._flow_key(state["flow_id"]), json.dumps(state), ex=self._flow_ttl_seconds
        )

    @staticmethod
    def _append_step(completed_steps: list[str], step: str) -> list[str]:
        if step in completed_steps:
            return completed_steps
        return [*completed_steps, step]

    @staticmethod
    def _require_step(state: SignupFlowState, expected: str) -> None:
        if state["current_step"] != expected:
            raise ValidationError(
                f"Invalid step order. Expected '{expected}' first.",
                code="signup_step_order_invalid",
                details={"current_step": state["current_step"], "expected_step": expected},
            )

    @staticmethod
    def _validate_dob(value: str) -> None:
        try:
            dob = datetime.strptime(value, "%Y-%m-%d")
        except ValueError as exc:
            raise ValidationError("Invalid date_of_birth format, expected YYYY-MM-DD.") from exc

        today = datetime.now(UTC).replace(tzinfo=None)
        age_years = (today - dob).days // 365
        min_age = get_settings().min_user_age_years
        if age_years < min_age:
            raise ValidationError(
                f"You must be at least {min_age} years old to register.",
                code="signup_age_requirement",
            )
        if age_years > 120:
            raise ValidationError(
                "Invalid date of birth.",
                code="signup_dob_invalid",
            )

    @staticmethod
    def _flow_key(flow_id: str) -> str:
        return f"signup:flow:{flow_id}"

    @staticmethod
    def _public_state(state: SignupFlowState) -> SignupFlowStateResponse:
        return SignupFlowStateResponse(
            flow_id=state["flow_id"],
            current_step=state["current_step"],
            completed_steps=state["completed_steps"],
            username=state["username"],
            email=state["email"],
            phone_e164=state["phone_e164"],
            date_of_birth=state["date_of_birth"],
        )


class SignupFlowState(TypedDict):
    flow_id: str
    current_step: str
    completed_steps: list[str]
    username: str
    email: str | None
    phone_e164: str | None
    verification_id: str | None
    date_of_birth: str | None
    created_at_epoch: int


# ################################ /SERVICE ################################
