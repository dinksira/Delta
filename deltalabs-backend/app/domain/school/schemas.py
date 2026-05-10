"""School domain schemas."""

from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class DomainEntity(BaseModel):
    """Backward-compatible placeholder entity."""

    id: str


class SchoolCustomFieldInput(BaseModel):
    key: str = Field(min_length=1, max_length=120)
    value: str = Field(min_length=1, max_length=500)


class SchoolCreateInput(BaseModel):
    """Payload for creating a school record."""

    name: str = Field(min_length=1, max_length=160)
    school_type: str = Field(min_length=1, max_length=80, serialization_alias="schoolType")
    email: str | None = None
    logo_url: str | None = Field(default=None, serialization_alias="logoUrl")
    custom_fields: list[SchoolCustomFieldInput] = Field(default_factory=list, serialization_alias="customFields")
    partners: list["SchoolPartnerInput"] = Field(default_factory=list)
    documents: list["SchoolDocumentInput"] = Field(default_factory=list)


class SchoolCreateMeInput(SchoolCreateInput):
    """Create-school payload for POST /v1/schools (me-centric orchestration)."""

    model_config = ConfigDict(populate_by_name=True)

    target_org_id: str | None = Field(
        default=None,
        description="If set, create the school in this org (requires school:manage). "
        "If omitted, a dedicated workspace org is created and the user becomes org_owner.",
        serialization_alias="targetOrgId",
    )


class SchoolPartnerInput(BaseModel):
    full_name: str = Field(min_length=1, max_length=120, serialization_alias="fullName")
    email: str | None = None
    ownership_percentage: float = Field(ge=0, le=100, serialization_alias="ownershipPercentage")
    share_accesses: list["SchoolShareAccessInput"] = Field(
        default_factory=list,
        serialization_alias="shareAccesses",
    )


class SchoolDocumentInput(BaseModel):
    title: str = Field(min_length=1, max_length=160)
    url: str | None = None


class SchoolShareAccessInput(BaseModel):
    access_name: str = Field(min_length=1, max_length=120, serialization_alias="accessName")
    status: str = Field(default="can_view", min_length=1, max_length=40)


class SchoolPublic(BaseModel):
    """Public school DTO."""

    model_config = ConfigDict(populate_by_name=True)

    id: str
    org_id: str = Field(serialization_alias="orgId")
    name: str
    slug: str
    school_type: str = Field(serialization_alias="schoolType")
    email: str | None = None
    logo_url: str | None = Field(default=None, serialization_alias="logoUrl")
    custom_fields: list[SchoolCustomFieldInput] = Field(default_factory=list, serialization_alias="customFields")
    partners: list[SchoolPartnerInput] = Field(default_factory=list)
    documents: list[SchoolDocumentInput] = Field(default_factory=list)
    onboarding_status: SchoolOnboardingStatus = Field(
        default="active",
        serialization_alias="onboardingStatus",
    )
    archived: bool = False
    created_at: datetime = Field(serialization_alias="createdAt")
    updated_at: datetime = Field(serialization_alias="updatedAt")


class SchoolListResponse(BaseModel):
    items: list[SchoolPublic]


class MySchoolMembershipItem(BaseModel):
    """One school the current user belongs to (school-scoped roles)."""

    model_config = ConfigDict(populate_by_name=True)

    school_id: str = Field(serialization_alias="schoolId")
    org_id: str = Field(serialization_alias="orgId")
    name: str
    slug: str
    school_type: str = Field(serialization_alias="schoolType")
    archived: bool
    role_keys: list[str] = Field(serialization_alias="roleKeys")


class MySchoolsResponse(BaseModel):
    items: list[MySchoolMembershipItem]


class SchoolArchiveInput(BaseModel):
    archived: bool


class SchoolArchiveResponse(BaseModel):
    archived: bool


class MarketplaceViewResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str
    org_id: str = Field(serialization_alias="orgId")
    school_id: str = Field(serialization_alias="schoolId")
    school_name: str = Field(serialization_alias="schoolName")
    school_type: str = Field(default="", serialization_alias="schoolType")
    title: str
    description: str
    price: float
    currency: str = "USD"
    owner_user_id: str = Field(serialization_alias="ownerUserId")
    bidder_user_id: str | None = Field(default=None, serialization_alias="bidderUserId")
    status: Literal["active", "under_offer", "sold", "withdrawn"] = "active"
    created_at: datetime = Field(serialization_alias="createdAt")


class MarketplaceListResponse(BaseModel):
    items: list[MarketplaceViewResponse]
    total: int
    page: int
    page_size: int = Field(serialization_alias="pageSize")


class MarketplaceCreateInput(BaseModel):
    school_id: str = Field(min_length=1, serialization_alias="schoolId")
    title: str = Field(min_length=1, max_length=160)
    description: str = Field(min_length=1, max_length=400)
    price: float = Field(ge=0)
    currency: str = Field(default="USD", min_length=3, max_length=8)


class MarketplaceUpdateInput(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=160)
    description: str | None = Field(default=None, min_length=1, max_length=400)
    price: float | None = Field(default=None, ge=0)
    currency: str | None = Field(default=None, min_length=3, max_length=8)


class MarketplaceBuyInput(BaseModel):
    listing_id: str = Field(min_length=1, serialization_alias="listingId")

class MarketplaceBidInput(BaseModel):
    listing_id: str = Field(min_length=1, serialization_alias="listingId")
    offered_price: float = Field(gt=0, serialization_alias="offeredPrice")
    offered_currency: str = Field(default="USD", min_length=3, max_length=8, serialization_alias="offeredCurrency")
    note: str | None = Field(default=None, max_length=500)


MarketplaceSortBy = Literal["created_at", "price", "title"]
MarketplaceSortDirection = Literal["asc", "desc"]


OfferStatus = Literal["requested", "approved", "amendment", "rejected"]
OfferListView = Literal["received", "sent"]
SchoolOnboardingStatus = Literal["active", "pending_partner_acceptance"]
SchoolWorkspaceItemType = Literal[
    "folder",
    "department",
    "class",
    "course",
    "management-table",
    "resource",
    "student",
    "service",
    "staff",
]


class SchoolWorkspaceCreateInput(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    type: SchoolWorkspaceItemType
    title: str = Field(min_length=1, max_length=160)
    description: str | None = Field(default=None, max_length=2000)
    metadata: dict[str, object] = Field(default_factory=dict)
    parent_id: str | None = Field(
        default=None,
        alias="parentId",
        description="Parent workspace item id; omit to attach under the school root department.",
    )


class SchoolWorkspaceUpdateInput(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    title: str | None = Field(default=None, min_length=1, max_length=160)
    description: str | None = Field(default=None, max_length=2000)
    metadata: dict[str, object] | None = None


class SchoolWorkspaceItemPublic(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str
    org_id: str = Field(serialization_alias="orgId")
    school_id: str = Field(serialization_alias="schoolId")
    parent_id: str | None = Field(default=None, serialization_alias="parentId")
    type: SchoolWorkspaceItemType
    title: str
    description: str | None = None
    metadata: dict[str, object] = Field(default_factory=dict)
    is_root: bool = Field(default=False, serialization_alias="isRoot")
    created_at: datetime = Field(serialization_alias="createdAt")
    updated_at: datetime = Field(serialization_alias="updatedAt")


class SchoolWorkspaceListResponse(BaseModel):
    items: list[SchoolWorkspaceItemPublic]


ClassSessionType = Literal["virtual", "in_person", "hybrid"]
ClassSessionStatus = Literal["draft", "scheduled", "live", "completed"]
ClassSessionCreationMode = Literal["single", "multiple"]


class ClassSessionCreateInput(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    title: str = Field(min_length=1, max_length=200)
    description: str | None = Field(default=None, max_length=4000)
    weight: float | None = Field(default=None, ge=0, le=10_000)
    duration_minutes: int | None = Field(
        default=None,
        ge=1,
        le=24 * 60,
        alias="durationMinutes",
        description="Planned session length in minutes.",
    )
    session_type: ClassSessionType = Field(default="virtual", alias="sessionType")
    scheduled_at: datetime | None = Field(default=None, alias="scheduledAt")
    creation_mode: ClassSessionCreationMode | None = Field(default="single", alias="creationMode")


class ClassSessionUpdateInput(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    title: str | None = Field(default=None, min_length=1, max_length=200)
    description: str | None = Field(default=None, max_length=4000)
    weight: float | None = Field(default=None, ge=0, le=10_000)
    duration_minutes: int | None = Field(default=None, ge=1, le=24 * 60, alias="durationMinutes")
    session_type: ClassSessionType | None = Field(default=None, alias="sessionType")
    scheduled_at: datetime | None = Field(default=None, alias="scheduledAt")
    status: ClassSessionStatus | None = None


class ClassSessionPublic(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str
    org_id: str = Field(serialization_alias="orgId")
    school_id: str = Field(serialization_alias="schoolId")
    class_workspace_item_id: str = Field(serialization_alias="classWorkspaceItemId")
    title: str
    description: str | None = None
    weight: float | None = None
    duration_minutes: int | None = Field(default=None, serialization_alias="durationMinutes")
    session_type: ClassSessionType = Field(serialization_alias="sessionType")
    scheduled_at: datetime | None = Field(default=None, serialization_alias="scheduledAt")
    status: ClassSessionStatus
    creation_mode: ClassSessionCreationMode | None = Field(default=None, serialization_alias="creationMode")
    created_at: datetime = Field(serialization_alias="createdAt")
    updated_at: datetime = Field(serialization_alias="updatedAt")


class ClassSessionListResponse(BaseModel):
    items: list[ClassSessionPublic]


class OfferPublic(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str
    org_id: str = Field(serialization_alias="orgId")
    school_id: str = Field(serialization_alias="schoolId")
    school_name: str = Field(serialization_alias="schoolName")
    status: OfferStatus
    requested_at: datetime = Field(serialization_alias="requestedAt")
    updated_at: datetime = Field(serialization_alias="updatedAt")
    recipient_email: str | None = Field(default=None, serialization_alias="recipientEmail")
    sender_user_id: str | None = Field(default=None, serialization_alias="senderUserId")
    sender_email: str | None = Field(default=None, serialization_alias="senderEmail")
    negotiation_turn: Literal["sender", "recipient"] = Field(default="recipient", serialization_alias="negotiationTurn")
    listing_id: str | None = Field(default=None, serialization_alias="listingId")
    shortlisted: bool = False
    party_full_name: str | None = Field(default=None, serialization_alias="partyFullName")
    party_email: str | None = Field(default=None, serialization_alias="partyEmail")
    ownership_percentage: float | None = Field(default=None, serialization_alias="ownershipPercentage")
    share_accesses: list[SchoolShareAccessInput] = Field(default_factory=list, serialization_alias="shareAccesses")
    offered_price: float | None = Field(default=None, serialization_alias="offeredPrice")
    offered_currency: str | None = Field(default=None, serialization_alias="offeredCurrency")
    note: str | None = None
    offer_kind: str | None = Field(default=None, serialization_alias="offerKind")
    amendment_data: dict[str, object] | None = Field(default=None, serialization_alias="amendmentData")
    expires_at: datetime | None = Field(default=None, serialization_alias="expiresAt")
    amendment_rounds: int = Field(default=0, serialization_alias="amendmentRounds")


class OfferListResponse(BaseModel):
    items: list[OfferPublic]


class OfferCreateInput(BaseModel):
    school_id: str = Field(min_length=1, serialization_alias="schoolId")


class OfferStatusUpdateInput(BaseModel):
    status: OfferStatus
    amendment_data: dict[str, object] | None = Field(default=None, serialization_alias="amendmentData")
