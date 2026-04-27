"""Unit tests for recover/reset service."""

from __future__ import annotations

from datetime import UTC, datetime

import pytest
from app.core.exceptions import ValidationError
from app.domain.identity.recover_service import RecoverService
from app.domain.identity.schemas import RecoverRequest, RecoverResetRequest, RecoverVerifyRequest


class FakeRedis:
    """Minimal async Redis stub for recover tests."""

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


class FakeUser:
    def __init__(self) -> None:
        self.id = "user-1"
        self.username = "demo"
        self.email = "demo@example.com"
        self.phone_e164 = None
        self.is_verified = True
        self.is_active = True
        self.password_hash = "x"
        self.username_normalized = "demo"
        self.email_normalized = "demo@example.com"
        self.created_at = datetime.now(UTC)
        self.updated_at = datetime.now(UTC)


class FakeRepository:
    """Minimal repository for recover flow tests."""

    def __init__(self) -> None:
        self.updated = False
        self.revoked = False

    async def find_user_by_identity(self, identity_raw: str) -> FakeUser | None:
        if identity_raw == "missing":
            return None
        return FakeUser()

    async def update_password_hash(self, user_id: str, password_hash: str) -> bool:  # noqa: ARG002
        self.updated = True
        return True

    async def revoke_all_sessions_for_user(self, user_id: str) -> int:  # noqa: ARG002
        self.revoked = True
        return 1


@pytest.mark.asyncio
async def test_recover_request_for_missing_user_is_generic() -> None:
    service = RecoverService(FakeRepository(), FakeRedis())  # type: ignore[arg-type]
    result = await service.request_recover(
        RecoverRequest(identity="missing"), ip_address="127.0.0.1"
    )
    assert result.status == "accepted"
    assert result.recover_id is None


@pytest.mark.asyncio
async def test_recover_verify_and_reset_happy_path() -> None:
    repo = FakeRepository()
    service = RecoverService(repo, FakeRedis())  # type: ignore[arg-type]
    requested = await service.request_recover(
        RecoverRequest(identity="demo@example.com"),
        ip_address="127.0.0.1",
    )
    assert requested.recover_id is not None
    assert requested.debug_code is not None

    verify = await service.verify_recover(
        RecoverVerifyRequest(
            recover_id=requested.recover_id,
            code=requested.debug_code,
        )
    )
    assert verify.status == "verified"
    assert verify.reset_token is not None

    reset = await service.reset_password(
        RecoverResetRequest(
            recover_id=requested.recover_id,
            reset_token=verify.reset_token,
            new_password="StrongReset123",
        )
    )
    assert reset.status == "password_reset"
    assert repo.updated is True
    assert repo.revoked is True


@pytest.mark.asyncio
async def test_recover_verify_invalid_code_fails() -> None:
    service = RecoverService(FakeRepository(), FakeRedis())  # type: ignore[arg-type]
    requested = await service.request_recover(
        RecoverRequest(identity="demo@example.com"),
        ip_address="127.0.0.1",
    )
    assert requested.recover_id is not None

    with pytest.raises(ValidationError) as exc:
        await service.verify_recover(
            RecoverVerifyRequest(
                recover_id=requested.recover_id,
                code="000000",
            )
        )
    assert exc.value.code == "recover_code_invalid"


# ################################ /MODULE ################################
