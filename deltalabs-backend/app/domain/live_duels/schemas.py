"""Live Duel domain schemas.

NOTE: Every `serialization_alias=` on a snake_case field must also have a
matching `validation_alias=` (same rule as `competitions/schemas.py`); Pydantic
v2 treats `serialization_alias` as OUTPUT-only, so camelCase JSON from the
frontend Live Duel views would not populate the Python attributes otherwise.
"""

from __future__ import annotations

from typing import Any

from pydantic import BaseModel, ConfigDict, Field


def _alias(name: str) -> dict[str, str]:
    """Return both validation_alias and serialization_alias for a camelCase name."""
    return {"validation_alias": name, "serialization_alias": name}


class LiveDuelCreateRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    title: str = Field(min_length=3, max_length=80)
    subject: str = Field(min_length=1, max_length=40)
    difficulty: str = Field(default="Medium", min_length=1, max_length=20)
    duration_label: str = Field(default="60 min", min_length=1, max_length=30, **_alias("durationLabel"))
    entry_fee: str = Field(default="Free", min_length=1, max_length=20, **_alias("entryFee"))
    prize_pool: str = Field(default="0 ETB", min_length=1, max_length=40, **_alias("prizePool"))
    players_max: int = Field(default=16, ge=2, le=100, **_alias("playersMax"))
    host_name: str = Field(min_length=1, max_length=60, **_alias("hostName"))
    host_avatar_url: str | None = Field(default=None, **_alias("hostAvatarUrl"))


class LiveDuelQuestionRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    text: str = Field(min_length=1, max_length=500)
    points: int = Field(default=100, ge=10, le=10000)
    time_label: str | None = Field(default=None, max_length=12, **_alias("timeLabel"))
    # Client-generated id: kept stable through the Pub/Sub echo so the host's
    # optimistic dispatch and the backend fan-out share one question id (the
    # frontend reducer dedupes on it). Falls back to a server ObjectId when
    # missing.
    id: str | None = Field(default=None, max_length=64)
    # Full authored question payload (all nine kinds) so the participant-side
    # `QuestionModal` renders the real structure instead of flat text only.
    question: dict[str, Any] | None = Field(default=None)


class LiveDuelAnswerRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    # ParticipantAnswer envelope from the duel quiz types, keyed by kind
    # (optionId / value / text / answers / map / itemIds / code).
    answer: dict[str, Any] = Field(...)


class LiveDuelChatRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    text: str = Field(min_length=1, max_length=500)
    emoji: str | None = Field(default=None, max_length=4)


class LiveDuelChatPayload(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    text: str = Field(min_length=1, max_length=500)
    emoji: str | None = Field(default=None, max_length=4)