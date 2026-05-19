"""OTP verification service for auth flows."""

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
from app.domain.identity.schemas import (
    VerificationSendRequest,
    VerificationSendResponse,
    VerificationVerifyRequest,
    VerificationVerifyResponse,
)
from app.infra.email_client import send_otp_email

RedisDep = AsyncRedis


class VerificationService:
    """Redis-backed OTP lifecycle service with basic anti-abuse controls."""

    # ################################ SERVICE ################################
    def __init__(self, redis: RedisDep) -> None:
        self._redis = redis
        self._settings = get_settings()
        self._ttl_seconds = 5 * 60
        self._resend_cooldown_seconds = 45
        self._max_attempts = 5
        self._ip_limit_per_minute = 20

    async def send_code(
        self,
        payload: VerificationSendRequest,
        *,
        ip_address: str,
        reuse_verification_id: str | None = None,
    ) -> VerificationSendResponse:
        await self._check_ip_throttle(ip_address)
        channel = payload.channel.strip().lower()
        if channel not in {"sms", "email"}:
            raise ValidationError(
                "Unsupported verification channel.",
                code="verification_channel_invalid",
            )

        destination = payload.destination.strip()
        code = f"{secrets.randbelow(1_000_000):06d}"
        verification_id = reuse_verification_id or str(uuid4())
        now = int(datetime.now(UTC).timestamp())
        state: VerificationState = {
            "verification_id": verification_id,
            "channel": channel,
            "destination": destination,
            "purpose": payload.purpose.strip().lower(),
            "code_hash": self._hash_code(code),
            "attempts": 0,
            "max_attempts": self._max_attempts,
            "created_at_epoch": now,
            "last_sent_at_epoch": now,
            "used": False,
        }
        await self._redis.set(
            self._verification_key(verification_id),
            json.dumps(state),
            ex=self._ttl_seconds,
        )

        # Deliver the code via the requested channel
        if channel == "email":
            delivery = await send_otp_email(
                to=destination,
                code=code,
                purpose=payload.purpose.strip().lower(),
            )
            if not delivery.ok:
                await self._redis.delete(self._verification_key(verification_id))
                if delivery.failure_reason == "not_configured":
                    raise ValidationError(
                        "Verification email could not be sent because email is not configured.",
                        code="verification_email_not_configured",
                    )
                raise ValidationError(
                    "Could not send verification email. Please try again later.",
                    code="verification_email_delivery_failed",
                )
        # SMS channel: wire Twilio/Africa's Talking here when ready

        return VerificationSendResponse(
            verification_id=verification_id,
            channel=channel,
            destination_masked=self._mask_destination(destination),
            expires_in_seconds=self._ttl_seconds,
            resend_available_in_seconds=self._resend_cooldown_seconds,
            debug_code=code if self._settings.env == "local" else None,
        )

    async def resend_code(
        self,
        verification_id: str,
        *,
        ip_address: str,
    ) -> VerificationSendResponse:
        state = await self._load_state(verification_id)
        now = int(datetime.now(UTC).timestamp())
        last_sent = state["last_sent_at_epoch"]
        elapsed = now - last_sent
        if elapsed < self._resend_cooldown_seconds:
            wait = self._resend_cooldown_seconds - elapsed
            raise ValidationError(
                f"Please wait {wait} seconds before requesting another code.",
                code="verification_resend_cooldown",
                details={"retry_after_seconds": wait},
            )
        request = VerificationSendRequest(
            channel=str(state["channel"]),
            destination=str(state["destination"]),
            purpose=str(state["purpose"]),
        )
        return await self.send_code(
            request,
            ip_address=ip_address,
            reuse_verification_id=verification_id,
        )

    async def verify_code(self, payload: VerificationVerifyRequest) -> VerificationVerifyResponse:
        state = await self._load_state(payload.verification_id)
        if bool(state.get("used", False)):
            raise ValidationError(
                "Verification code already used.",
                code="verification_code_replayed",
            )

        attempts = state["attempts"]
        max_attempts = state["max_attempts"]
        if attempts >= max_attempts:
            raise ValidationError(
                "Verification attempts exhausted.",
                code="verification_attempts_exhausted",
            )

        provided_hash = self._hash_code(payload.code.strip())
        expected_hash = state["code_hash"]
        attempts += 1
        state["attempts"] = attempts
        if provided_hash != expected_hash:
            await self._persist_state(payload.verification_id, state)
            raise ValidationError("Verification code is invalid.", code="verification_code_invalid")

        state["used"] = True
        await self._persist_state(payload.verification_id, state)
        return VerificationVerifyResponse(
            verification_id=payload.verification_id,
            verified=True,
            status="verified",
        )

    async def _check_ip_throttle(self, ip_address: str) -> None:
        key = f"otp:ip:{ip_address}:minute"
        value = await self._redis.incr(key)
        if value == 1:
            await self._redis.expire(key, 60)
        if int(value) > self._ip_limit_per_minute:
            raise ValidationError(
                "Too many verification requests.",
                code="verification_rate_limited",
            )

    async def _load_state(self, verification_id: str) -> VerificationState:
        raw = await self._redis.get(self._verification_key(verification_id))
        if raw is None:
            raise ValidationError(
                "Verification request is missing or expired.",
                code="verification_expired",
            )
        parsed = json.loads(raw)
        return VerificationState(
            verification_id=str(parsed["verification_id"]),
            channel=str(parsed["channel"]),
            destination=str(parsed["destination"]),
            purpose=str(parsed["purpose"]),
            code_hash=str(parsed["code_hash"]),
            attempts=int(parsed["attempts"]),
            max_attempts=int(parsed["max_attempts"]),
            created_at_epoch=int(parsed["created_at_epoch"]),
            last_sent_at_epoch=int(parsed["last_sent_at_epoch"]),
            used=bool(parsed["used"]),
        )

    async def _persist_state(self, verification_id: str, state: VerificationState) -> None:
        await self._redis.set(
            self._verification_key(verification_id),
            json.dumps(state),
            ex=self._ttl_seconds,
        )

    @staticmethod
    def _hash_code(code: str) -> str:
        return hashlib.sha256(code.encode("utf-8")).hexdigest()

    @staticmethod
    def _mask_destination(destination: str) -> str:
        if "@" in destination:
            local, domain = destination.split("@", maxsplit=1)
            prefix = local[:2]
            return f"{prefix}***@{domain}"
        if len(destination) <= 4:
            return "***"
        return f"{destination[:2]}***{destination[-2:]}"

    @staticmethod
    def _verification_key(verification_id: str) -> str:
        return f"otp:verification:{verification_id}"


class VerificationState(TypedDict):
    verification_id: str
    channel: str
    destination: str
    purpose: str
    code_hash: str
    attempts: int
    max_attempts: int
    created_at_epoch: int
    last_sent_at_epoch: int
    used: bool


# ################################ /SERVICE ################################
