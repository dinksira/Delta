"""Pydantic models for course-scoped Q&A (Stack Overflow–style per course)."""

from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator


CourseQaVisibility = Literal["public", "private"]
CourseQaPricing = Literal["free", "paid"]
CourseQaQuestionStatus = Literal["open", "closed", "trash"]
CourseQaVoteValue = Literal[-1, 1]


class CourseQaAuthorPublic(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    user_id: str = Field(serialization_alias="userId")
    username: str
    full_name: str | None = Field(default=None, serialization_alias="fullName")
    avatar_url: str | None = Field(default=None, serialization_alias="avatarUrl")


class CourseQaCommentPublic(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str
    text: str
    author: CourseQaAuthorPublic
    created_at: datetime = Field(serialization_alias="createdAt")


class CourseQaAnswerPublic(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str
    question_id: str = Field(serialization_alias="questionId")
    body: str
    author: CourseQaAuthorPublic
    is_anonymous: bool = Field(default=False, serialization_alias="isAnonymous")
    vote_score: int = Field(default=0, serialization_alias="voteScore")
    my_vote: int = Field(default=0, serialization_alias="myVote")
    is_accepted: bool = Field(default=False, serialization_alias="isAccepted")
    comments: list[CourseQaCommentPublic] = Field(default_factory=list)
    created_at: datetime = Field(serialization_alias="createdAt")
    updated_at: datetime = Field(serialization_alias="updatedAt")


class CourseQaQuestionPublic(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str
    org_id: str = Field(serialization_alias="orgId")
    school_id: str = Field(serialization_alias="schoolId")
    course_workspace_item_id: str = Field(serialization_alias="courseWorkspaceItemId")
    title: str
    body: str
    tags: list[str] = Field(default_factory=list)
    visibility: CourseQaVisibility = "public"
    pricing: CourseQaPricing = "free"
    status: CourseQaQuestionStatus = "open"
    author: CourseQaAuthorPublic
    vote_score: int = Field(default=0, serialization_alias="voteScore")
    my_vote: int = Field(default=0, serialization_alias="myVote")
    view_count: int = Field(default=0, serialization_alias="viewCount")
    answer_count: int = Field(default=0, serialization_alias="answerCount")
    accepted_answer_id: str | None = Field(default=None, serialization_alias="acceptedAnswerId")
    bookmarked_by_me: bool = Field(default=False, serialization_alias="bookmarkedByMe")
    created_at: datetime = Field(serialization_alias="createdAt")
    updated_at: datetime = Field(serialization_alias="updatedAt")


class CourseQaQuestionDetailPublic(CourseQaQuestionPublic):
    answers: list[CourseQaAnswerPublic] = Field(default_factory=list)


class CourseQaQuestionListResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    items: list[CourseQaQuestionPublic]
    total: int


class CourseQaQuestionCreateInput(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    title: str = Field(min_length=1, max_length=300)
    body: str = Field(min_length=20, max_length=50_000)
    tags: list[str] = Field(default_factory=list, max_length=5)
    visibility: CourseQaVisibility = "public"
    pricing: CourseQaPricing = "free"

    @field_validator("tags")
    @classmethod
    def _normalize_tags(cls, value: list[str]) -> list[str]:
        out: list[str] = []
        seen: set[str] = set()
        for raw in value:
            tag = " ".join(str(raw).strip().split())
            if not tag:
                continue
            key = tag.lower()
            if key in seen:
                continue
            seen.add(key)
            out.append(tag[:40])
            if len(out) >= 5:
                break
        return out


class CourseQaQuestionUpdateInput(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    title: str | None = Field(default=None, min_length=1, max_length=300)
    body: str | None = Field(default=None, min_length=20, max_length=50_000)
    tags: list[str] | None = Field(default=None, max_length=5)
    visibility: CourseQaVisibility | None = None
    pricing: CourseQaPricing | None = None
    status: CourseQaQuestionStatus | None = None


class CourseQaAnswerCreateInput(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    body: str = Field(min_length=1, max_length=50_000)
    is_anonymous: bool = Field(default=False, alias="isAnonymous")


class CourseQaAnswerUpdateInput(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    body: str | None = Field(default=None, min_length=1, max_length=50_000)


class CourseQaVoteInput(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    value: CourseQaVoteValue


class CourseQaCommentCreateInput(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    text: str = Field(min_length=1, max_length=2000)
