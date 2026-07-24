"""Pydantic models for school Ghost Resources (host-agnostic)."""

from __future__ import annotations

from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field


GhostHostType = Literal["course", "class", "department", "school"]
GhostImplementationType = Literal["same_base", "branch_base"]
GhostStatus = Literal["open", "in_progress", "fulfilled", "cancelled"]
GhostNodeRole = Literal["end", "dependency", "variant"]
GhostNodeStatus = Literal[
    "open",
    "in_progress",
    "submitted",
    "approved",
    "rejected",
    "merged",
    "abandoned",
]


class GhostRequirementAttachmentPublic(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    # alias (not serialization_alias) so PATCH bodies accept camelCase from the FE
    media_id: str = Field(alias="mediaId")
    file_name: str = Field(alias="fileName")


class GhostNodePublic(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str
    ghost_id: str = Field(serialization_alias="ghostId")
    name: str
    role: GhostNodeRole
    is_default: bool = Field(serialization_alias="isDefault")
    required: bool
    implementation_type: GhostImplementationType = Field(serialization_alias="implementationType")
    assignee_user_ids: list[str] = Field(default_factory=list, serialization_alias="assigneeUserIds")
    status: GhostNodeStatus
    blocked: bool = False
    blocked_by_variant_ids: list[str] = Field(
        default_factory=list,
        serialization_alias="blockedByVariantIds",
    )
    available_inputs: list[dict[str, Any]] = Field(
        default_factory=list,
        serialization_alias="availableInputs",
    )
    submission_note: str | None = Field(default=None, serialization_alias="submissionNote")
    forked_from_variant_id: str | None = Field(default=None, serialization_alias="forkedFromVariantId")
    working_head_version: int = Field(default=1, serialization_alias="workingHeadVersion")
    sort_order: int = Field(serialization_alias="sortOrder")
    created_at: datetime = Field(serialization_alias="createdAt")
    updated_at: datetime = Field(serialization_alias="updatedAt")


class GhostEdgePublic(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str
    ghost_id: str = Field(serialization_alias="ghostId")
    from_variant_id: str = Field(serialization_alias="fromVariantId")
    to_variant_id: str = Field(serialization_alias="toVariantId")
    created_at: datetime = Field(serialization_alias="createdAt")


class GhostEventPublic(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str
    ghost_id: str = Field(serialization_alias="ghostId")
    type: str
    actor_user_id: str = Field(serialization_alias="actorUserId")
    meta: dict[str, Any] = Field(default_factory=dict)
    created_at: datetime = Field(serialization_alias="createdAt")


class GhostPublic(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str
    org_id: str = Field(serialization_alias="orgId")
    school_id: str = Field(serialization_alias="schoolId")
    host_type: GhostHostType = Field(serialization_alias="hostType")
    host_workspace_item_id: str = Field(serialization_alias="hostWorkspaceItemId")
    title: str
    description: str
    requirement_attachments: list[GhostRequirementAttachmentPublic] = Field(
        default_factory=list,
        serialization_alias="requirementAttachments",
    )
    implementation_type: GhostImplementationType = Field(serialization_alias="implementationType")
    due_at: datetime | None = Field(default=None, serialization_alias="dueAt")
    resource_kind: str = Field(serialization_alias="resourceKind")
    slot_key: str = Field(serialization_alias="slotKey")
    status: GhostStatus
    default_variant_id: str | None = Field(default=None, serialization_alias="defaultVariantId")
    created_by_user_id: str = Field(serialization_alias="createdByUserId")
    created_at: datetime = Field(serialization_alias="createdAt")
    updated_at: datetime = Field(serialization_alias="updatedAt")
    promoted_resource: dict[str, Any] | None = Field(default=None, serialization_alias="promotedResource")
    can_fulfill: bool = Field(default=False, serialization_alias="canFulfill")
    nodes: list[GhostNodePublic] = Field(default_factory=list)
    edges: list[GhostEdgePublic] = Field(default_factory=list)


class GhostListResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    items: list[GhostPublic]
    total: int


class GhostCreateInput(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    host_type: GhostHostType = Field(alias="hostType")
    host_workspace_item_id: str = Field(alias="hostWorkspaceItemId", min_length=1, max_length=120)
    title: str = Field(default="", max_length=200)
    description: str = Field(default="", max_length=4000)
    implementation_type: GhostImplementationType = Field(default="same_base", alias="implementationType")
    due_at: datetime | None = Field(default=None, alias="dueAt")
    resource_kind: str = Field(default="document", alias="resourceKind", max_length=40)
    slot_key: str = Field(default="", alias="slotKey", max_length=120)
    default_node_name: str = Field(default="Default", alias="defaultNodeName", max_length=120)


class GhostUpdateInput(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    title: str | None = Field(default=None, max_length=200)
    description: str | None = Field(default=None, max_length=4000)
    implementation_type: GhostImplementationType | None = Field(default=None, alias="implementationType")
    due_at: datetime | None = Field(default=None, alias="dueAt")
    requirement_attachments: list[GhostRequirementAttachmentPublic] | None = Field(
        default=None,
        alias="requirementAttachments",
    )
    status: GhostStatus | None = None


class GhostNodeCreateInput(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    name: str = Field(min_length=1, max_length=120)
    role: GhostNodeRole = "variant"
    implementation_type: GhostImplementationType = Field(default="same_base", alias="implementationType")
    required: bool = False
    is_default: bool = Field(default=False, alias="isDefault")
    connect_from_variant_id: str | None = Field(default=None, alias="connectFromVariantId")


class GhostNodeUpdateInput(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    name: str | None = Field(default=None, min_length=1, max_length=120)
    implementation_type: GhostImplementationType | None = Field(default=None, alias="implementationType")
    required: bool | None = None
    status: GhostNodeStatus | None = None
    assignee_user_ids: list[str] | None = Field(default=None, alias="assigneeUserIds")


class GhostEdgeCreateInput(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    from_variant_id: str = Field(alias="fromVariantId", min_length=1)
    to_variant_id: str = Field(alias="toVariantId", min_length=1)


class GhostNodeSubmitInput(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    note: str = Field(default="", max_length=2000)
    output_refs: list[dict[str, Any]] = Field(default_factory=list, alias="outputRefs")


GhostReviewDecision = Literal["approve", "changes_requested", "reject"]


class GhostNodeReviewInput(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    decision: GhostReviewDecision
    note: str = Field(default="", max_length=2000)


class GhostFulfillInput(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    end_variant_id: str | None = Field(default=None, alias="endVariantId")


class GhostEventListResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    items: list[GhostEventPublic]
    total: int


class GhostMyWorkItemPublic(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    ghost_id: str = Field(serialization_alias="ghostId")
    ghost_title: str = Field(serialization_alias="ghostTitle")
    host_type: GhostHostType = Field(serialization_alias="hostType")
    host_workspace_item_id: str = Field(serialization_alias="hostWorkspaceItemId")
    variant_id: str = Field(serialization_alias="variantId")
    variant_name: str = Field(serialization_alias="variantName")
    status: GhostNodeStatus
    blocked: bool
    implementation_type: GhostImplementationType = Field(serialization_alias="implementationType")
    due_at: datetime | None = Field(default=None, serialization_alias="dueAt")


class GhostMyWorkResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    items: list[GhostMyWorkItemPublic]
    total: int
