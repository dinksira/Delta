"""Library repository — feature catalog in MongoDB."""

from __future__ import annotations

from datetime import UTC, datetime
from typing import Any

from motor.motor_asyncio import AsyncIOMotorDatabase
from pymongo import ASCENDING

from app.domain.authorization.schemas import AuthorizationAccessProfile
from app.domain.library.schemas import FeatureCapabilities, FeaturePublic


class Repository:
    """MongoDB access for `feature_catalog` and related reads."""

    # ################################ REPOSITORY ################################
    def __init__(self, db: AsyncIOMotorDatabase[dict[str, Any]]) -> None:
        self._db = db

    async def ping(self) -> bool:
        """Connectivity check used by foundation tests."""
        return True

    async def ensure_indexes(self) -> None:
        """Indexes per execution plan (feature catalog)."""
        await self._db["feature_catalog"].create_index(
            "feature_key",
            unique=True,
            name="uq_feature_catalog_feature_key",
        )
        await self._db["feature_catalog"].create_index(
            [("enabled", ASCENDING), ("sort_order", ASCENDING)],
            name="ix_feature_catalog_enabled_sort",
        )

    async def list_enabled_features(self) -> list[dict[str, Any]]:
        """Return enabled features sorted for UI."""
        cursor = (
            self._db["feature_catalog"]
            .find({"enabled": True})
            .sort(
                [("sort_order", ASCENDING), ("feature_key", ASCENDING)],
            )
        )
        return await cursor.to_list(length=500)

    async def find_feature_by_key(self, feature_key: str) -> dict[str, Any] | None:
        """Load one feature by stable key (must be enabled for public API)."""
        return await self._db["feature_catalog"].find_one(
            {"feature_key": feature_key, "enabled": True},
        )

    async def insert_demo_catalog_if_empty(self) -> None:
        """Seed demo rows for local development when collection is empty."""
        if await self._db["feature_catalog"].count_documents({}) > 0:
            return
        now = datetime.now(UTC)
        demos: list[dict[str, Any]] = [
            {
                "_id": "feat_school",
                "feature_key": "school",
                "title": "School",
                "description": "Manage schools, staff, and academic structure.",
                "enabled": True,
                "beta": False,
                "sort_order": 10,
                "route_path": "/features/school",
                "capability_requirements": {
                    "view": ["school:read"],
                    "join": ["school:read"],
                    "create": ["school:manage"],
                    "manage": ["school:manage"],
                },
                "created_at": now,
                "updated_at": now,
            },
            {
                "_id": "feat_course",
                "feature_key": "course",
                "title": "Courses",
                "description": "Courses, curriculum, and learner progress.",
                "enabled": True,
                "beta": False,
                "sort_order": 20,
                "route_path": "/features/course",
                "capability_requirements": {
                    "view": ["course:learn", "course:teach", "course:manage"],
                    "join": ["course:learn"],
                    "create": ["course:manage"],
                    "manage": ["course:manage"],
                },
                "created_at": now,
                "updated_at": now,
            },
            {
                "_id": "feat_feed",
                "feature_key": "feed",
                "title": "Feed",
                "description": "Public discovery and content stream.",
                "enabled": True,
                "beta": False,
                "sort_order": 5,
                "route_path": "/explore",
                "capability_requirements": {
                    "view": ["content:read"],
                    "join": [],
                    "create": ["content:write"],
                    "manage": ["content:write"],
                },
                "created_at": now,
                "updated_at": now,
            },
        ]
        await self._db["feature_catalog"].insert_many(demos)

    @staticmethod
    def doc_to_feature(
        doc: dict[str, Any],
        *,
        access_profile: AuthorizationAccessProfile | None = None,
    ) -> FeaturePublic:
        """Map Mongo document to API DTO."""
        permissions = set(access_profile.permissions if access_profile is not None else [])
        requirements = _feature_requirements(doc)
        return FeaturePublic(
            feature_key=str(doc["feature_key"]),
            title=str(doc["title"]),
            description=str(doc["description"]),
            enabled=bool(doc.get("enabled", True)),
            beta=bool(doc.get("beta", False)),
            sort_order=int(doc.get("sort_order", 0)),
            route_path=doc.get("route_path"),
            membership_state=(
                access_profile.membership_state if access_profile is not None else "none"
            ),
            role_keys=(access_profile.role_keys if access_profile is not None else []),
            capabilities=FeatureCapabilities(
                can_view=_has_any_permission(permissions, requirements["view"]),
                can_join=_has_any_permission(permissions, requirements["join"]),
                can_create=_has_any_permission(permissions, requirements["create"]),
                can_manage=_has_any_permission(permissions, requirements["manage"]),
            ),
        )


def _feature_requirements(doc: dict[str, Any]) -> dict[str, list[str]]:
    raw = doc.get("capability_requirements")
    if not isinstance(raw, dict):
        return {"view": [], "join": [], "create": [], "manage": []}
    result: dict[str, list[str]] = {}
    for key in ("view", "join", "create", "manage"):
        value = raw.get(key, [])
        if isinstance(value, list):
            result[key] = [str(item) for item in value]
        else:
            result[key] = []
    return result


def _has_any_permission(user_permissions: set[str], required_permissions: list[str]) -> bool:
    if "*" in user_permissions:
        return True
    if not required_permissions:
        return True
    return any(permission in user_permissions for permission in required_permissions)


# ################################ /REPOSITORY ################################
