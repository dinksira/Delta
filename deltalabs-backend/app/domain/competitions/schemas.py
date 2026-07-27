"""Competitions domain schemas for topic battle CRUD.

NOTE: Every `serialization_alias=` on a snake_case field must also have a
matching `validation_alias=`. Pydantic v2 treats `serialization_alias` as
OUTPUT-only, so camelCase fields from the frontend (e.g. "isSample", "testCases")
would NOT populate the Python attributes without a validation alias.
"""

from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class DomainEntity(BaseModel):
    id: str


def _alias(name: str) -> dict[str, str]:
    """Return both validation_alias and serialization_alias for a camelCase name."""
    return {"validation_alias": name, "serialization_alias": name}


class TestCaseSchema(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    input: str = Field(default="")
    expected_output: str = Field(default="", **_alias("expectedOutput"))
    explanation: str = Field(default="")
    is_sample: bool = Field(default=False, **_alias("isSample"))
    is_hidden: bool = Field(default=False, **_alias("isHidden"))


class CodingQuestionSchema(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str = Field(default="")
    title: str = Field(default="", max_length=200)
    description: str = Field(default="")
    code_template: str = Field(default="", **_alias("codeTemplate"))
    language: str = Field(default="HTML", max_length=50)
    difficulty: str = Field(default="EASY", max_length=20)
    time_limit_minutes: int = Field(
        default=10, ge=1, le=180, **_alias("timeLimitMinutes"),
    )
    points: float = Field(default=1.0, ge=0)
    hint_enabled: bool = Field(default=True, **_alias("hintEnabled"))
    hint_text: str = Field(default="", **_alias("hintText"))
    test_cases: list[TestCaseSchema] = Field(
        default_factory=list, **_alias("testCases"),
    )


class TopicBattleCreateRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    title: str = Field(min_length=1, max_length=200)
    subject: str = Field(min_length=1, max_length=100)
    difficulty: str = Field(default="Intermediate", max_length=50)
    entry_fee: str = Field(default="Free", max_length=50, **_alias("entryFee"))
    prize_pool: str = Field(default="0 ETB", max_length=50, **_alias("prizePool"))
    players_max: int = Field(default=2, ge=2, le=1000, **_alias("playersMax"))
    creator_name: str = Field(default="You", max_length=100, **_alias("creatorName"))
    schedule_date: str = Field(default="", max_length=20)
    schedule_time: str = Field(default="", max_length=10)
    schedule_timezone: str = Field(default="UTC", max_length=50)
    questions: list[CodingQuestionSchema] = Field(default_factory=list)


class TopicBattleResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str
    title: str
    subject: str
    difficulty: str
    status: str
    countdown_ends_at: str | None = Field(default=None, **_alias("countdownEndsAt"))
    creator: dict[str, Any] = Field(**_alias("creator"))
    prize_pool: str = Field(**_alias("prizePool"))
    entry_fee: str = Field(**_alias("entryFee"))
    players_joined: int = Field(**_alias("playersJoined"))
    players_max: int = Field(**_alias("playersMax"))
    created_at: datetime = Field(**_alias("createdAt"))
    questions: list[QuestionResponse] = Field(default_factory=list)


class TopicBattleListResponse(BaseModel):
    battles: list[TopicBattleResponse]
    total: int


class QuestionCreateRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    title: str = Field(max_length=200)
    description: str = Field(default="")
    code_template: str = Field(default="", **_alias("codeTemplate"))
    language: str = Field(default="HTML", max_length=50)
    difficulty: str = Field(default="EASY", max_length=20)
    time_limit_minutes: int = Field(
        default=10, ge=1, le=180, **_alias("timeLimitMinutes"),
    )
    points: float = Field(default=1.0, ge=0)
    hint_enabled: bool = Field(default=True, **_alias("hintEnabled"))
    hint_text: str = Field(default="", **_alias("hintText"))
    test_cases: list[TestCaseSchema] = Field(
        default_factory=list, **_alias("testCases"),
    )


class QuestionUpdateRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    title: str | None = Field(default=None, max_length=200)
    description: str | None = None
    code_template: str | None = Field(default=None, **_alias("codeTemplate"))
    language: str | None = Field(default=None, max_length=50)
    difficulty: str | None = Field(default=None, max_length=20)
    time_limit_minutes: int | None = Field(
        default=None, ge=1, le=180, **_alias("timeLimitMinutes"),
    )
    points: float | None = Field(default=None, ge=0)
    hint_enabled: bool | None = Field(default=None, **_alias("hintEnabled"))
    hint_text: str | None = Field(default=None, **_alias("hintText"))
    test_cases: list[TestCaseSchema] | None = Field(default=None, **_alias("testCases"))


class QuestionResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str
    title: str
    description: str
    code_template: str = Field(**_alias("codeTemplate"))
    language: str
    difficulty: str
    time_limit_minutes: int = Field(**_alias("timeLimitMinutes"))
    points: float
    hint_enabled: bool = Field(**_alias("hintEnabled"))
    hint_text: str = Field(**_alias("hintText"))
    test_cases: list[TestCaseSchema] = Field(**_alias("testCases"))
