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


# ################################ /TYPES ################################
