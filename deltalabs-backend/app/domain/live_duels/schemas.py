"""Live Duel domain schemas.

NOTE: Every `serialization_alias=` on a snake_case field must also have a
matching `validation_alias=` (same rule as `competitions/schemas.py`); Pydantic
v2 treats `serialization_alias` as OUTPUT-only, so camelCase JSON from the
frontend Live Duel views would not populate the Python attributes otherwise.
"""

from __future__ import annotations

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


class LiveDuelChatRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    text: str = Field(min_length=1, max_length=500)
    emoji: str | None = Field(default=None, max_length=4)


class LiveDuelChatPayload(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    text: str = Field(min_length=1, max_length=500)
    emoji: str | None = Field(default=None, max_length=4)