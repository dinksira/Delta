"""Pydantic models for course Score board."""

from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class CourseScoreAssessmentPublic(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str
    title: str
    max_points: float = Field(serialization_alias="maxPoints")


class CourseScoreLinePublic(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    assessment_id: str = Field(serialization_alias="assessmentId")
    points: float | None = None
    rank: int | None = None


class CourseScoreEntryPublic(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str
    student_user_id: str | None = Field(default=None, serialization_alias="studentUserId")
    display_name: str = Field(serialization_alias="displayName")
    subtitle: str = ""
    avatar_url: str | None = Field(default=None, serialization_alias="avatarUrl")
    lines: list[CourseScoreLinePublic] = Field(default_factory=list)
    total_points: float = Field(serialization_alias="totalPoints")
    max_total: float = Field(serialization_alias="maxTotal")
    status_percent: int = Field(serialization_alias="statusPercent")
    rank: int
    updated_at: datetime = Field(serialization_alias="updatedAt")


class CourseScoreBoardPublic(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str
    org_id: str = Field(serialization_alias="orgId")
    school_id: str = Field(serialization_alias="schoolId")
    course_workspace_item_id: str = Field(serialization_alias="courseWorkspaceItemId")
    assessments: list[CourseScoreAssessmentPublic]
    entries: list[CourseScoreEntryPublic]
    updated_at: datetime = Field(serialization_alias="updatedAt")


class CourseScoreAssessmentInput(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str | None = None
    title: str = Field(min_length=1, max_length=120)
    max_points: float = Field(default=30, alias="maxPoints", ge=0, le=10_000)


class CourseScoreLineInput(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    assessment_id: str = Field(alias="assessmentId", min_length=1, max_length=80)
    points: float | None = Field(default=None, ge=0, le=10_000)


class CourseScoreEntryInput(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str | None = None
    student_user_id: str | None = Field(default=None, alias="studentUserId", max_length=80)
    display_name: str = Field(alias="displayName", min_length=1, max_length=160)
    subtitle: str = Field(default="", max_length=160)
    avatar_url: str | None = Field(default=None, alias="avatarUrl", max_length=2000)
    lines: list[CourseScoreLineInput] = Field(default_factory=list)
    updated_at: datetime | None = Field(default=None, alias="updatedAt")


class CourseScoreBoardReplaceInput(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    assessments: list[CourseScoreAssessmentInput] = Field(default_factory=list)
    entries: list[CourseScoreEntryInput] = Field(default_factory=list)
