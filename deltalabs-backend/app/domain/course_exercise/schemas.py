"""Pydantic models for course Exercise & Test."""

from __future__ import annotations

from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field


CourseExerciseKind = Literal["exercise", "test"]
CourseExerciseStatus = Literal["draft", "published", "deleted"]
CourseExerciseVisibility = Literal["public", "private", "unlisted"]
ExerciseQuestionType = Literal[
    "mcq",
    "true_false",
    "fill_blank",
    "matching",
    "writing",
    "ordering",
]


class CourseExerciseAuthorPublic(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    user_id: str = Field(serialization_alias="userId")
    username: str
    full_name: str | None = Field(default=None, serialization_alias="fullName")
    avatar_url: str | None = Field(default=None, serialization_alias="avatarUrl")


class ExerciseOptionPublic(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str
    label: str = ""
    text: str = ""
    is_correct: bool = Field(default=False, alias="isCorrect", serialization_alias="isCorrect")
    ghosted: bool = False
    image_url: str = Field(default="", alias="imageUrl", serialization_alias="imageUrl")


class ExerciseMatchingItemPublic(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str
    text: str = ""


class ExerciseQuestionVariantPublic(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str
    name: str = "Variant 1"
    type: ExerciseQuestionType | None = None
    stem_html: str = Field(default="", alias="stemHtml", serialization_alias="stemHtml")
    stem_ghosted: bool = Field(default=False, alias="stemGhosted", serialization_alias="stemGhosted")
    options: list[ExerciseOptionPublic] = Field(default_factory=list)
    matching_description: str = Field(
        default="",
        alias="matchingDescription",
        serialization_alias="matchingDescription",
    )
    column_a: list[ExerciseMatchingItemPublic] = Field(
        default_factory=list,
        alias="columnA",
        serialization_alias="columnA",
    )
    column_b: list[ExerciseMatchingItemPublic] = Field(
        default_factory=list,
        alias="columnB",
        serialization_alias="columnB",
    )
    blanks: list[str] = Field(default_factory=list)
    ordering_items: list[ExerciseMatchingItemPublic] = Field(
        default_factory=list,
        alias="orderingItems",
        serialization_alias="orderingItems",
    )
    writing_prompt: str = Field(default="", alias="writingPrompt", serialization_alias="writingPrompt")


class ExerciseQuestionPublic(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str
    order: int = 0
    active_variant_id: str = Field(alias="activeVariantId", serialization_alias="activeVariantId")
    variants: list[ExerciseQuestionVariantPublic] = Field(default_factory=list)


class CourseExercisePublic(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str
    org_id: str = Field(serialization_alias="orgId")
    school_id: str = Field(serialization_alias="schoolId")
    course_workspace_item_id: str = Field(serialization_alias="courseWorkspaceItemId")
    kind: CourseExerciseKind
    title: str
    time_taken: str = Field(serialization_alias="timeTaken")
    time_minutes: int | None = Field(default=None, serialization_alias="timeMinutes")
    total_questions: int = Field(serialization_alias="totalQuestions")
    total_mark: int | None = Field(default=None, serialization_alias="totalMark")
    take_with_friend: bool = Field(default=False, serialization_alias="takeWithFriend")
    visibility: CourseExerciseVisibility = "public"
    status: CourseExerciseStatus = "draft"
    cover_image_url: str = Field(default="", serialization_alias="coverImageUrl")
    org_label: str = Field(default="", serialization_alias="orgLabel")
    ghost_id: str | None = Field(default=None, serialization_alias="ghostId")
    questions: list[ExerciseQuestionPublic] = Field(default_factory=list)
    created_by: CourseExerciseAuthorPublic = Field(serialization_alias="createdBy")
    created_at: datetime = Field(serialization_alias="createdAt")
    updated_at: datetime = Field(serialization_alias="updatedAt")


class CourseExerciseListResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    items: list[CourseExercisePublic]
    total: int


class CourseExerciseCreateInput(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    title: str = Field(default="New Exercise", min_length=1, max_length=200)
    time_taken: str = Field(default="", alias="timeTaken", max_length=80)
    time_minutes: int | None = Field(default=None, alias="timeMinutes", ge=0, le=24 * 60)
    total_questions: int = Field(default=0, alias="totalQuestions", ge=0, le=10_000)
    total_mark: int | None = Field(default=None, alias="totalMark", ge=0, le=1_000_000)
    take_with_friend: bool = Field(default=False, alias="takeWithFriend")
    visibility: CourseExerciseVisibility = "public"
    status: CourseExerciseStatus = "draft"
    kind: CourseExerciseKind = "exercise"
    cover_image_url: str = Field(default="", alias="coverImageUrl", max_length=2000)
    org_label: str = Field(default="", alias="orgLabel", max_length=120)
    questions: list[dict[str, Any]] | None = None


class CourseExerciseUpdateInput(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    title: str | None = Field(default=None, min_length=1, max_length=200)
    time_taken: str | None = Field(default=None, alias="timeTaken", max_length=80)
    time_minutes: int | None = Field(default=None, alias="timeMinutes", ge=0, le=24 * 60)
    total_questions: int | None = Field(default=None, alias="totalQuestions", ge=0, le=10_000)
    total_mark: int | None = Field(default=None, alias="totalMark", ge=0, le=1_000_000)
    take_with_friend: bool | None = Field(default=None, alias="takeWithFriend")
    visibility: CourseExerciseVisibility | None = None
    status: CourseExerciseStatus | None = None
    cover_image_url: str | None = Field(default=None, alias="coverImageUrl", max_length=2000)
    org_label: str | None = Field(default=None, alias="orgLabel", max_length=120)
    questions: list[dict[str, Any]] | None = None
