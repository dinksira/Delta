"""School domain schemas."""

from __future__ import annotations

from datetime import datetime
from typing import Any, Literal

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


class SchoolUpdateInput(SchoolCreateInput):
    """Payload for updating a school record (same shape as create)."""


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
    "parent",
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


ClassEnrollmentRole = Literal["student"]
ClassEnrollmentStatus = Literal["active", "withdrawn", "pending"]


class ClassEnrollmentUserPublic(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    user_id: str = Field(serialization_alias="userId")
    username: str | None = None
    email: str | None = None
    full_name: str | None = Field(default=None, serialization_alias="fullName")


class ClassEnrollmentCreateInput(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    user_id: str | None = Field(default=None, alias="userId")
    email: str | None = Field(default=None, min_length=3, max_length=320)


class ClassEnrollmentPublic(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str
    org_id: str = Field(serialization_alias="orgId")
    school_id: str = Field(serialization_alias="schoolId")
    class_workspace_item_id: str = Field(serialization_alias="classWorkspaceItemId")
    user_id: str = Field(serialization_alias="userId")
    role: ClassEnrollmentRole
    status: ClassEnrollmentStatus
    enrolled_at: datetime = Field(serialization_alias="enrolledAt")
    updated_at: datetime = Field(serialization_alias="updatedAt")
    enrolled_by_user_id: str | None = Field(default=None, serialization_alias="enrolledByUserId")
    user: ClassEnrollmentUserPublic


class ClassEnrollmentListResponse(BaseModel):
    items: list[ClassEnrollmentPublic]


AttendanceMarkStatus = Literal["present", "absent", "late"]
AttendanceDeviceType = Literal["qr_scanner", "fingerprint", "other"]
AttendanceDeviceStatus = Literal["online", "offline"]
AttendanceSessionTracking = Literal["manual", "device"]
AttendanceFormulaOperation = Literal["sum", "average", "count_present"]
AttendanceFormulaMode = Literal["preset", "custom"]
AttendanceFaceTrackOption = Literal["random_sampling", "continuous"]


class AttendanceFaceDetectionSettingsPublic(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    section: str = "all"
    track_option: AttendanceFaceTrackOption = Field(default="random_sampling", serialization_alias="trackOption")
    sampling_interval_minutes: int = Field(default=5, serialization_alias="samplingIntervalMinutes")
    presence_threshold_percent: int = Field(default=80, serialization_alias="presenceThresholdPercent")


class AttendanceFormulaConfigPublic(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    mode: AttendanceFormulaMode = "preset"
    operation: AttendanceFormulaOperation = "sum"
    session_ids: list[str] = Field(default_factory=list, serialization_alias="sessionIds")
    custom_expression: str = Field(default="", serialization_alias="customExpression")


class AttendanceRealtimeTrackPublic(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    enabled: bool = False
    face_detection: bool = Field(default=False, serialization_alias="faceDetection")
    voice_recognition: bool = Field(default=False, serialization_alias="voiceRecognition")
    record_video: bool = Field(default=False, serialization_alias="recordVideo")
    record_audio: bool = Field(default=False, serialization_alias="recordAudio")
    face_detection_settings: AttendanceFaceDetectionSettingsPublic = Field(
        default_factory=AttendanceFaceDetectionSettingsPublic,
        serialization_alias="faceDetectionSettings",
    )


class AttendanceSessionPublic(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str
    title: str
    scheduled_at: datetime | None = Field(default=None, serialization_alias="scheduledAt")
    hidden: bool = False
    tracking_mode: AttendanceSessionTracking = Field(default="manual", serialization_alias="trackingMode")
    created_at: datetime = Field(serialization_alias="createdAt")


class AttendanceDevicePublic(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str
    name: str
    device_type: AttendanceDeviceType = Field(serialization_alias="deviceType")
    attendance_session_label: str = Field(serialization_alias="attendanceSessionLabel")
    status: AttendanceDeviceStatus = "online"
    last_synced_at: datetime | None = Field(default=None, serialization_alias="lastSyncedAt")
    created_at: datetime = Field(serialization_alias="createdAt")


class ClassAttendanceStatePublic(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    sessions: list[AttendanceSessionPublic] = Field(default_factory=list)
    devices: list[AttendanceDevicePublic] = Field(default_factory=list)
    marks: dict[str, AttendanceMarkStatus] = Field(default_factory=dict)
    formula_config: AttendanceFormulaConfigPublic = Field(
        default_factory=AttendanceFormulaConfigPublic,
        serialization_alias="formulaConfig",
    )
    realtime_track: AttendanceRealtimeTrackPublic = Field(
        default_factory=AttendanceRealtimeTrackPublic,
        serialization_alias="realtimeTrack",
    )


class AttendanceSessionSettingsInput(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    class_session_id: str = Field(min_length=1, max_length=64, alias="classSessionId")
    hidden: bool = False
    tracking_mode: AttendanceSessionTracking = Field(default="manual", alias="trackingMode")


class AttendanceDeviceCreateInput(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    name: str = Field(min_length=1, max_length=200)
    device_type: AttendanceDeviceType = Field(default="fingerprint", alias="deviceType")
    attendance_session_label: str = Field(default="Class Attendance", alias="attendanceSessionLabel")


class AttendanceMarkPatchInput(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    student_id: str = Field(min_length=1, alias="studentId")
    session_id: str = Field(min_length=1, alias="sessionId")
    status: AttendanceMarkStatus | None = None


class AttendanceFormulaConfigPutInput(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    mode: AttendanceFormulaMode = "preset"
    operation: AttendanceFormulaOperation = "sum"
    session_ids: list[str] = Field(default_factory=list, alias="sessionIds")
    custom_expression: str = Field(default="", alias="customExpression")


class AttendanceRealtimeTrackPutInput(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    enabled: bool = False
    face_detection: bool = Field(default=False, alias="faceDetection")
    voice_recognition: bool = Field(default=False, alias="voiceRecognition")
    record_video: bool = Field(default=False, alias="recordVideo")
    record_audio: bool = Field(default=False, alias="recordAudio")
    face_detection_settings: AttendanceFaceDetectionSettingsPublic = Field(
        default_factory=AttendanceFaceDetectionSettingsPublic,
        alias="faceDetectionSettings",
    )


class LeaveRequestSubmitInput(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    """Column id → value for student-fillable fields (not Student or Status)."""
    cells: dict[str, Any] = Field(default_factory=dict)


class SchoolMemberSearchUserPublic(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    user_id: str = Field(serialization_alias="userId")
    username: str | None = None
    email: str | None = None
    full_name: str | None = Field(default=None, serialization_alias="fullName")


class SchoolMemberSearchResponse(BaseModel):
    items: list[SchoolMemberSearchUserPublic]


SchoolMemberSearchPicker = Literal["school_students", "school_parents", "school_teachers", "class_students", "platform"]


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


# --- Class roadmap (sections + class path contents) ---

ClassRoadmapResourceKind = Literal["session", "course", "assignment", "exam", "video"]
ClassRoadmapContentType = Literal["video", "exam", "assignment", "session", "course"]
ClassRoadmapContentStatus = Literal["pending", "completed"]


class ClassRoadmapContentItemInput(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str = Field(min_length=1, max_length=80)
    kind: ClassRoadmapResourceKind
    content_type: ClassRoadmapContentType = Field(alias="contentType")
    title: str = Field(min_length=1, max_length=300)
    subtitle: str | None = Field(default=None, max_length=500)
    source_key: str | None = Field(default=None, alias="sourceKey", max_length=200)
    tags: list[str] = Field(default_factory=list)
    status: ClassRoadmapContentStatus = "pending"


class ClassRoadmapSectionInput(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str = Field(min_length=1, max_length=80)
    title: str = Field(min_length=1, max_length=300)
    description: str = Field(default="", max_length=4000)
    tags: list[str] = Field(default_factory=list)
    collapsed: bool = False
    contents: list[ClassRoadmapContentItemInput] = Field(default_factory=list)


class ClassRoadmapPutInput(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    sections: list[ClassRoadmapSectionInput] = Field(default_factory=list)
    current_section_id: str | None = Field(default=None, alias="currentSectionId")
    current_content_id: str | None = Field(default=None, alias="currentContentId")


class ClassRoadmapContentItemPublic(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str
    kind: ClassRoadmapResourceKind
    content_type: ClassRoadmapContentType = Field(serialization_alias="contentType")
    title: str
    subtitle: str | None = None
    source_key: str | None = Field(default=None, serialization_alias="sourceKey")
    tags: list[str] = Field(default_factory=list)
    status: ClassRoadmapContentStatus


class ClassRoadmapSectionPublic(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str
    title: str
    description: str
    tags: list[str] = Field(default_factory=list)
    collapsed: bool
    contents: list[ClassRoadmapContentItemPublic] = Field(default_factory=list)


class ClassRoadmapPublic(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    org_id: str = Field(serialization_alias="orgId")
    school_id: str = Field(serialization_alias="schoolId")
    class_workspace_item_id: str = Field(serialization_alias="classWorkspaceItemId")
    sections: list[ClassRoadmapSectionPublic] = Field(default_factory=list)
    current_section_id: str | None = Field(default=None, serialization_alias="currentSectionId")
    current_content_id: str | None = Field(default=None, serialization_alias="currentContentId")
    created_at: datetime | None = Field(default=None, serialization_alias="createdAt")
    updated_at: datetime | None = Field(default=None, serialization_alias="updatedAt")


class ClassRoadmapSidebarResourcePublic(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str
    kind: ClassRoadmapResourceKind
    content_type: ClassRoadmapContentType = Field(serialization_alias="contentType")
    title: str
    subtitle: str | None = None
    source_key: str = Field(serialization_alias="sourceKey")


class ClassRoadmapResourcesResponse(BaseModel):
    sessions: list[ClassRoadmapSidebarResourcePublic] = Field(default_factory=list)
    courses: list[ClassRoadmapSidebarResourcePublic] = Field(default_factory=list)
    materials: list[ClassRoadmapSidebarResourcePublic] = Field(default_factory=list)

