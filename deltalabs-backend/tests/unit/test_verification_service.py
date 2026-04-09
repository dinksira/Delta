"""Unit tests for OTP verification service."""

import pytest
from app.core.exceptions import ValidationError
from app.domain.identity.schemas import (
    VerificationSendRequest,
    VerificationVerifyRequest,
)
from app.domain.identity.verification_service import VerificationService


class FakeRedis:
    """Minimal async Redis stub for OTP service tests."""

    # ################################ MODULE ################################
    def __init__(self) -> None:
        self._store: dict[str, str] = {}
        self._counter: dict[str, int] = {}

    async def set(self, key: str, value: str, ex: int | None = None) -> None:  # noqa: ARG002
        self._store[key] = value

    async def get(self, key: str) -> str | None:
        return self._store.get(key)

    async def incr(self, key: str) -> int:
        self._counter[key] = self._counter.get(key, 0) + 1
        return self._counter[key]

    async def expire(self, key: str, seconds: int) -> bool:  # noqa: ARG002
        return key in self._counter or key in self._store


@pytest.mark.asyncio
async def test_send_and_verify_happy_path() -> None:
    service = VerificationService(FakeRedis())  # type: ignore[arg-type]
    send_payload = VerificationSendRequest(channel="email", destination="user@example.com")
    issued = await service.send_code(send_payload, ip_address="127.0.0.1")
    assert issued.verification_id
    assert issued.status == "sent"
    assert issued.debug_code is not None

    verify_payload = VerificationVerifyRequest(
        verification_id=issued.verification_id,
        code=str(issued.debug_code),
    )
    verified = await service.verify_code(verify_payload)
    assert verified.verified is True
    assert verified.status == "verified"


@pytest.mark.asyncio
async def test_verify_with_bad_code_fails() -> None:
    service = VerificationService(FakeRedis())  # type: ignore[arg-type]
    send_payload = VerificationSendRequest(channel="sms", destination="+251900000000")
    issued = await service.send_code(send_payload, ip_address="127.0.0.1")

    with pytest.raises(ValidationError) as exc:
        await service.verify_code(
            VerificationVerifyRequest(verification_id=issued.verification_id, code="000000")
        )
    assert exc.value.code == "verification_code_invalid"


@pytest.mark.asyncio
async def test_resend_enforces_cooldown() -> None:
    service = VerificationService(FakeRedis())  # type: ignore[arg-type]
    send_payload = VerificationSendRequest(channel="email", destination="user@example.com")
    issued = await service.send_code(send_payload, ip_address="127.0.0.1")

    with pytest.raises(ValidationError) as exc:
        await service.resend_code(
            issued.verification_id,
            ip_address="127.0.0.1",
        )
    assert exc.value.code == "verification_resend_cooldown"


# ################################ /MODULE ################################
