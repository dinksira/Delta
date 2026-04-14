"""Library domain schemas; includes feature catalog DTOs for P7."""

from pydantic import BaseModel, ConfigDict, Field


class DomainEntity(BaseModel):
    """Backward-compatible skeleton symbol for foundation tests."""

    # ################################ TYPES ################################
    id: str


class FeatureCapabilities(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    can_view: bool = Field(serialization_alias="canView")
    can_join: bool = Field(serialization_alias="canJoin")
    can_create: bool = Field(serialization_alias="canCreate")
    can_manage: bool = Field(serialization_alias="canManage")


class FeaturePublic(BaseModel):
    """Single feature card for the authorized features workspace."""

    model_config = ConfigDict(populate_by_name=True)

    feature_key: str = Field(serialization_alias="featureKey")
    title: str
    description: str
    enabled: bool = True
    beta: bool = False
    sort_order: int = Field(serialization_alias="sortOrder")
    route_path: str | None = Field(default=None, serialization_alias="routePath")
    membership_state: str = Field(default="none", serialization_alias="membershipState")
    role_keys: list[str] = Field(default_factory=list, serialization_alias="roleKeys")
    capabilities: FeatureCapabilities = Field(serialization_alias="capabilities")


class FeaturesListResponse(BaseModel):
    """Catalog list for GET /v1/features."""

    items: list[FeaturePublic]


class FeatureCapabilityRequirements(BaseModel):
    """Permission requirements used to derive feature capabilities."""

    view: list[str] = Field(default_factory=list)
    join: list[str] = Field(default_factory=list)
    create: list[str] = Field(default_factory=list)
    manage: list[str] = Field(default_factory=list)


class FeatureCreateInput(BaseModel):
    """Payload for creating a feature catalog entry."""

    feature_key: str = Field(min_length=1, max_length=100, serialization_alias="featureKey")
    title: str = Field(min_length=1, max_length=120)
    description: str = Field(min_length=1, max_length=500)
    enabled: bool = True
    beta: bool = False
    sort_order: int = Field(default=0, serialization_alias="sortOrder")
    route_path: str | None = Field(default=None, serialization_alias="routePath")
    capability_requirements: FeatureCapabilityRequirements = Field(
        default_factory=FeatureCapabilityRequirements,
        serialization_alias="capabilityRequirements",
    )


class FeatureUpdateInput(BaseModel):
    """Payload for partially updating a feature catalog entry."""

    title: str | None = Field(default=None, min_length=1, max_length=120)
    description: str | None = Field(default=None, min_length=1, max_length=500)
    enabled: bool | None = None
    beta: bool | None = None
    sort_order: int | None = Field(default=None, serialization_alias="sortOrder")
    route_path: str | None = Field(default=None, serialization_alias="routePath")
    capability_requirements: FeatureCapabilityRequirements | None = Field(
        default=None,
        serialization_alias="capabilityRequirements",
    )


class FeatureDeleteResponse(BaseModel):
    """Response contract for feature deletion."""

    deleted: bool


class FeatureSeedResponse(BaseModel):
    """Response contract for seeding default feature catalog rows."""

    inserted_count: int = Field(serialization_alias="insertedCount")
    existing_count: int = Field(serialization_alias="existingCount")
    total_defaults: int = Field(serialization_alias="totalDefaults")


# ################################ /TYPES ################################
