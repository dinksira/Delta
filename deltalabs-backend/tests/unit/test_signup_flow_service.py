"""Unit tests for signup flow orchestration."""

import pytest
from app.core.exceptions import ValidationError
from app.domain.identity.schemas import (
    SignupStepContactRequest,
    SignupStepIdentityRequest,
)
from app.domain.identity.signup_flow_service import SignupFlowService


class FakeRedis:
    """Minimal async Redis stub for signup flow tests."""

    # ################################ MODULE ################################
    def __init__(self) -> None:
        self._store: dict[str, str] = {}

    async def set(self, key: str, value: str, ex: int | None = None) -> None:  # noqa: ARG002
        self._store[key] = value

    async def get(self, key: str) -> str | None:
        return self._store.get(key)

    async def delete(self, key: str) -> int:
        existed = key in self._store
        self._store.pop(key, None)
        return 1 if existed else 0


class FakeRepository:
    """Minimal repository methods needed for these flow tests."""

    async def find_user_by_identity(self, identity_raw: str) -> None:  # noqa: ARG002
        return None


@pytest.mark.asyncio
async def test_identity_step_creates_new_flow() -> None:
    service = SignupFlowService(  # type: ignore[arg-type]
        repository=FakeRepository(),
        redis=FakeRedis(),
        session_ttl_minutes=60,
    )
    state = await service.step_identity(SignupStepIdentityRequest(username="newuser"))
    assert state.flow_id
    assert state.current_step == "identity"
    assert state.completed_steps == ["identity"]


@pytest.mark.asyncio
async def test_contact_before_identity_is_rejected() -> None:
    service = SignupFlowService(  # type: ignore[arg-type]
        repository=FakeRepository(),
        redis=FakeRedis(),
        session_ttl_minutes=60,
    )
    with pytest.raises(ValidationError) as exc:
        await service.step_contact(
            SignupStepContactRequest(
                flow_id="missing-flow",
                email="user@example.com",
            )
        )
    assert exc.value.code == "signup_flow_expired"


# ################################ /MODULE ################################
