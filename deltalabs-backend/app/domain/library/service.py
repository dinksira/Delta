"""Library domain service — feature catalog."""

from __future__ import annotations

from app.core.config import get_settings
from app.core.exceptions import NotFoundError
from app.domain.authorization.schemas import AuthorizationAccessProfile
from app.domain.library.repository import Repository
from app.domain.library.schemas import FeaturePublic, FeaturesListResponse


# ################################ SERVICE ################################
# Feature catalog orchestration and response shaping.
class Service:
    """Feature catalog reads with bootstrap/seed."""

    def __init__(self, repository: Repository) -> None:
        self._repository = repository

    async def healthcheck(self) -> bool:
        """Placeholder service method used by foundation tests."""
        return await self._repository.ping()

    async def bootstrap_catalog(self) -> None:
        """Indexes and optional local seed."""
        await self._repository.ensure_indexes()
        settings = get_settings()
        if settings.env == "local":
            await self._repository.insert_demo_catalog_if_empty()

    async def list_features(
        self, *, access_profile: AuthorizationAccessProfile
    ) -> FeaturesListResponse:
        """Return enabled features for authenticated users."""
        docs = await self._repository.list_enabled_features()
        items = [Repository.doc_to_feature(doc, access_profile=access_profile) for doc in docs]
        return FeaturesListResponse(items=items)

    async def get_feature(
        self,
        feature_key: str,
        *,
        access_profile: AuthorizationAccessProfile,
    ) -> FeaturePublic:
        """Return one enabled feature or 404."""
        doc = await self._repository.find_feature_by_key(feature_key)
        if doc is None:
            raise NotFoundError("Feature not found.", code="feature_not_found")
        return Repository.doc_to_feature(doc, access_profile=access_profile)


# ################################ /SERVICE ################################
