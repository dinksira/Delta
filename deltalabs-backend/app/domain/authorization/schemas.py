"""Schemas for tenant-scoped RBAC + relationship checks."""

from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

ScopeType = Literal["org", "school", "lab", "course", "global"]
RelationshipType = Literal["parent_of", "mentor_of", "guardian_of"]


class OrgPublic(BaseModel):
    id: str
    slug: str
    name: str
    is_active: bool = True
    created_at: datetime
    updated_at: datetime


class OrgCreateRequest(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    slug: str = Field(min_length=2, max_length=80)


class OrgCreateResponse(BaseModel):
    org: OrgPublic
    membership_state: str = Field(serialization_alias="membershipState")
    role_keys: list[str] = Field(default_factory=list, serialization_alias="roleKeys")


class OrgJoinResponse(BaseModel):
    org: OrgPublic
    membership_state: str = Field(serialization_alias="membershipState")
    role_keys: list[str] = Field(default_factory=list, serialization_alias="roleKeys")


class MyOrgsResponse(BaseModel):
    items: list[OrgPublic]


class OrgMembership(BaseModel):
    org_id: str
    user_id: str
    status: Literal["active", "invited", "suspended"] = "active"
    created_at: datetime
    updated_at: datetime


class RoleBinding(BaseModel):
    org_id: str
    subject_user_id: str
    role_key: str
    scope_type: ScopeType = "org"
    scope_id: str
    created_at: datetime
    updated_at: datetime


class RoleDefinition(BaseModel):
    role_key: str
    title: str
    permissions: list[str]
    description: str | None = None
    created_at: datetime
    updated_at: datetime


class RelationshipLink(BaseModel):
    org_id: str
    relation: RelationshipType
    from_user_id: str
    to_user_id: str
    scope_type: ScopeType | None = None
    scope_id: str | None = None
    created_at: datetime
    updated_at: datetime


class AuthorizationScope(BaseModel):
    scope_type: ScopeType
    scope_id: str
    resource_owner_user_id: str | None = None


class AuthorizationDecision(BaseModel):
    allowed: bool
    reason: str
    permission: str
    org_id: str
    scope_type: ScopeType
    scope_id: str


class AuthorizationAccessProfile(BaseModel):
    org_id: str
    role_keys: list[str]
    permissions: list[str]
    membership_state: str


class OrgAccessPublic(BaseModel):
    """Org-scoped RBAC snapshot for the signed-in user (API / JSON)."""

    model_config = ConfigDict(populate_by_name=True)

    org_id: str = Field(serialization_alias="orgId")
    role_keys: list[str] = Field(default_factory=list, serialization_alias="roleKeys")
    permissions: list[str] = Field(default_factory=list)
    membership_state: str = Field(serialization_alias="membershipState")


class PermissionCheckRequest(BaseModel):
    org_id: str = Field(min_length=1)
    permission: str = Field(min_length=3)
    scope_type: ScopeType
    scope_id: str = Field(min_length=1)
    resource_owner_user_id: str | None = None


# ################################ TYPES ################################
# ################################ /TYPES ################################
