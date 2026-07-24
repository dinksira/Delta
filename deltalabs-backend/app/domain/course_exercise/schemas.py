"""Pydantic models for course Exercise & Test."""

from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


CourseExerciseKind = Literal["exercise", "test"]


class CourseExerciseAuthorPublic(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    user_id: str = Field(serialization_alias="userId")
    username: str
    full_name: str | None = Field(default=None, serialization_alias="fullName")
    avatar_url: str | None = Field(default=None, serialization_alias="avatarUrl")


class CourseExercisePublic(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str
    org_id: str = Field(serialization_alias="orgId")
    school_id: str = Field(serialization_alias="schoolId")
    course_workspace_item_id: str = Field(serialization_alias="courseWorkspaceItemId")
    kind: CourseExerciseKind
    title: str
    time_taken: str = Field(serialization_alias="timeTaken")
    total_questions: int = Field(serialization_alias="totalQuestions")
    cover_image_url: str = Field(default="", serialization_alias="coverImageUrl")
    org_label: str = Field(default="", serialization_alias="orgLabel")
    created_by: CourseExerciseAuthorPublic = Field(serialization_alias="createdBy")
    created_at: datetime = Field(serialization_alias="createdAt")
    updated_at: datetime = Field(serialization_alias="updatedAt")


class CourseExerciseListResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    items: list[CourseExercisePublic]
    total: int


class CourseExerciseCreateInput(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    title: str = Field(min_length=1, max_length=200)
    time_taken: str = Field(default="", alias="timeTaken", max_length=80)
    total_questions: int = Field(default=0, alias="totalQuestions", ge=0, le=10_000)
    kind: CourseExerciseKind = "exercise"
    cover_image_url: str = Field(default="", alias="coverImageUrl", max_length=2000)
    org_label: str = Field(default="", alias="orgLabel", max_length=120)


class CourseExerciseUpdateInput(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    title: str | None = Field(default=None, min_length=1, max_length=200)
    time_taken: str | None = Field(default=None, alias="timeTaken", max_length=80)
    total_questions: int | None = Field(default=None, alias="totalQuestions", ge=0, le=10_000)
    cover_image_url: str | None = Field(default=None, alias="coverImageUrl", max_length=2000)
    org_label: str | None = Field(default=None, alias="orgLabel", max_length=120)
