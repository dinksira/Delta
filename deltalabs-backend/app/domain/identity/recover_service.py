"""Recover/reset password pipeline with anti-replay controls."""

from __future__ import annotations

import hashlib
import json
import secrets
from datetime import UTC, datetime
from typing import TypedDict
from uuid import uuid4

from app.compat.redis_typing import AsyncRedis
from app.core.config import get_settings
from app.core.exceptions import ValidationError
from app.core.security import hash_password, validate_password_policy
from app.domain.identity.repository import Repository
from app.domain.identity.schemas import (
    RecoverRequest,
    RecoverRequestResponse,
    RecoverResetRequest,
    RecoverResetResponse,
    RecoverVerifyRequest,
    RecoverVerifyResponse,
)
from app.infra.email_client import send_otp_email

RedisDep = AsyncRedis


class RecoverService:
    """Handles recover request, verify, and reset operations."""

    # ################################ SERVICE ################################
    def __init__(self, repository: Repository, redis: RedisDep) -> None:
        self._repository = repository
        self._redis = redis
        self._settings = get_settings()
        self._recover_ttl_seconds = 15 * 60
        self._max_attempts = 6

    async def request_recover(
        self, payload: RecoverRequest, *, ip_address: str
    ) -> RecoverRequestResponse:
        await self._check_rate_limit(ip_address=ip_address, identity=payload.identity)
        user = await self._repository.find_user_by_identity(payload.identity)
        if user is None:
            # Generic response by design to prevent account enumeration.
            return RecoverRequestResponse()

        recover_id = str(uuid4())
        code = f"{secrets.randbelow(1_000_000):06d}"
        state: RecoverState = {
            "recover_id": recover_id,
            "user_id": user.id,
            "code_hash": self._hash_value(code),
            "attempts": 0,
            "max_attempts": self._max_attempts,
            "verified": False,
            "reset_token_hash": None,
            "reset_used": False,
            "created_at_epoch": int(datetime.now(UTC).timestamp()),
        }
        await self._persist_state(state)

        # Send the recovery code to the user's email or phone
        if user.email is not None:
            sent = await send_otp_email(
                to=user.email,
                code=code,
                purpose="recover",
            )
            if not sent:
                await self._redis.delete(self._state_key(recover_id))
                raise ValidationError(
                    "Could not send recovery email. Please try again later.",
                    code="recover_email_delivery_failed",
                )
        # SMS fallback: wire Twilio/Africa's Talking here when ready

        return RecoverRequestResponse(
            recover_id=recover_id,
            debug_code=code if self._settings.env == "local" else None,
        )

    async def verify_recover(self, payload: RecoverVerifyRequest) -> RecoverVerifyResponse:
        state = await self._load_state(payload.recover_id)
        if state["verified"]:
            raise ValidationError("Recovery is already verified.", code="recover_already_verified")

        attempts = state["attempts"]
        if attempts >= state["max_attempts"]:
            raise ValidationError("Recovery attempts exhausted.", code="recover_attempts_exhausted")

        state["attempts"] = attempts + 1
        if self._hash_value(payload.code.strip()) != state["code_hash"]:
            await self._persist_state(state)
            raise ValidationError("Recovery code is invalid.", code="recover_code_invalid")

        reset_token = secrets.token_urlsafe(32)
        state["verified"] = True
        state["reset_token_hash"] = self._hash_value(reset_token)
        await self._persist_state(state)
        return RecoverVerifyResponse(status="verified", reset_token=reset_token)

    async def reset_password(self, payload: RecoverResetRequest) -> RecoverResetResponse:
        state = await self._load_state(payload.recover_id)
        if not state["verified"]:
            raise ValidationError(
                "Recovery verification required first.", code="recover_verification_required"
            )
        if state["reset_used"]:
            raise ValidationError("Reset token already used.", code="recover_reset_token_replayed")
        token_hash = self._hash_value(payload.reset_token.strip())
        if state["reset_token_hash"] is None or token_hash != state["reset_token_hash"]:
            raise ValidationError("Reset token is invalid.", code="recover_reset_token_invalid")

        validate_password_policy(payload.new_password)
        updated = await self._repository.update_password_hash(
            state["user_id"],
            hash_password(payload.new_password),
        )
        if not updated:
            raise ValidationError("Unable to update password.", code="recover_user_missing")

        await self._repository.revoke_all_sessions_for_user(state["user_id"])
        state["reset_used"] = True
        await self._persist_state(state)
        return RecoverResetResponse()

    async def _check_rate_limit(self, *, ip_address: str, identity: str) -> None:
        ip_key = f"recover:ip:{ip_address}:minute"
        ip_count = await self._redis.incr(ip_key)
        if ip_count == 1:
            await self._redis.expire(ip_key, 60)
        if int(ip_count) > 20:
            raise ValidationError("Too many recover requests.", code="recover_rate_limited")

        identity_key = f"recover:identity:{identity.strip().lower()}:minute"
        identity_count = await self._redis.incr(identity_key)
        if identity_count == 1:
            await self._redis.expire(identity_key, 60)
        if int(identity_count) > 5:
            raise ValidationError("Too many recover requests.", code="recover_rate_limited")

    async def _load_state(self, recover_id: str) -> RecoverState:
        raw = await self._redis.get(self._state_key(recover_id))
        if raw is None:
            raise ValidationError("Recovery request is missing or expired.", code="recover_expired")
        parsed = json.loads(raw)
        return RecoverState(
            recover_id=str(parsed["recover_id"]),
            user_id=str(parsed["user_id"]),
            code_hash=str(parsed["code_hash"]),
            attempts=int(parsed["attempts"]),
            max_attempts=int(parsed["max_attempts"]),
            verified=bool(parsed["verified"]),
            reset_token_hash=(
                str(parsed["reset_token_hash"]) if parsed["reset_token_hash"] is not None else None
            ),
            reset_used=bool(parsed["reset_used"]),
            created_at_epoch=int(parsed["created_at_epoch"]),
        )

    async def _persist_state(self, state: RecoverState) -> None:
        await self._redis.set(
            self._state_key(state["recover_id"]),
            json.dumps(state),
            ex=self._recover_ttl_seconds,
        )

    @staticmethod
    def _hash_value(value: str) -> str:
        return hashlib.sha256(value.encode("utf-8")).hexdigest()

    @staticmethod
    def _state_key(recover_id: str) -> str:
        return f"recover:state:{recover_id}"


class RecoverState(TypedDict):
    recover_id: str
    user_id: str
    code_hash: str
    attempts: int
    max_attempts: int
    verified: bool
    reset_token_hash: str | None
    reset_used: bool
    created_at_epoch: int


# ################################ /SERVICE ################################
