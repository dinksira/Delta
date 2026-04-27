"""Library repository — feature catalog in MongoDB."""

from __future__ import annotations

from datetime import UTC, datetime
from typing import Any

from motor.motor_asyncio import AsyncIOMotorDatabase
from pymongo import ASCENDING
from pymongo.errors import DuplicateKeyError

from app.core.exceptions import ConflictError
from app.domain.authorization.schemas import AuthorizationAccessProfile
from app.domain.library.schemas import (
    FeatureCapabilities,
    FeatureCreateInput,
    FeaturePublic,
    FeatureSeedResponse,
    FeatureUpdateInput,
)


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

    async def find_feature_any_state(self, feature_key: str) -> dict[str, Any] | None:
        """Load one feature by stable key regardless of enabled state."""
        return await self._db["feature_catalog"].find_one({"feature_key": feature_key})

    async def create_feature(self, payload: FeatureCreateInput) -> dict[str, Any]:
        """Insert a new feature; raises ConflictError if key already exists."""
        now = datetime.now(UTC)
        feature_key = payload.feature_key.strip().lower()
        doc: dict[str, Any] = {
            "_id": f"feat_{feature_key}",
            "feature_key": feature_key,
            "title": payload.title.strip(),
            "description": payload.description.strip(),
            "enabled": payload.enabled,
            "beta": payload.beta,
            "sort_order": payload.sort_order,
            "route_path": payload.route_path,
            "capability_requirements": payload.capability_requirements.model_dump(),
            "created_at": now,
            "updated_at": now,
        }
        try:
            await self._db["feature_catalog"].insert_one(doc)
        except DuplicateKeyError as exc:
            raise ConflictError(
                "Feature key already exists.",
                code="feature_key_conflict",
                details={"featureKey": feature_key},
            ) from exc
        inserted = await self.find_feature_any_state(feature_key)
        assert inserted is not None
        return inserted

    async def update_feature(
        self,
        feature_key: str,
        payload: FeatureUpdateInput,
    ) -> dict[str, Any] | None:
        """Partially update an existing feature by key."""
        updates: dict[str, Any] = {"updated_at": datetime.now(UTC)}
        if payload.title is not None:
            updates["title"] = payload.title.strip()
        if payload.description is not None:
            updates["description"] = payload.description.strip()
        if payload.enabled is not None:
            updates["enabled"] = payload.enabled
        if payload.beta is not None:
            updates["beta"] = payload.beta
        if payload.sort_order is not None:
            updates["sort_order"] = payload.sort_order
        if payload.route_path is not None:
            updates["route_path"] = payload.route_path
        if payload.capability_requirements is not None:
            updates["capability_requirements"] = payload.capability_requirements.model_dump()
        await self._db["feature_catalog"].update_one(
            {"feature_key": feature_key},
            {"$set": updates},
        )
        return await self.find_feature_any_state(feature_key)

    async def delete_feature(self, feature_key: str) -> bool:
        """Delete a feature by key."""
        result = await self._db["feature_catalog"].delete_one({"feature_key": feature_key})
        return result.deleted_count > 0

    async def insert_demo_catalog_if_empty(self) -> FeatureSeedResponse:
        """Seed default feature catalog rows only when the collection is empty."""
        existing_docs = await self._db["feature_catalog"].count_documents({}, limit=1)
        if existing_docs > 0:
            demos = self._default_demo_catalog()
            return FeatureSeedResponse(
                inserted_count=0,
                existing_count=len(demos),
                total_defaults=len(demos),
            )
        return await self.upsert_demo_catalog()

    async def upsert_demo_catalog(self) -> FeatureSeedResponse:
        """Upsert default feature catalog rows; preserve existing feature records."""
        demos = self._default_demo_catalog()
        inserted_count = 0
        existing_count = 0
        for doc in demos:
            result = await self._db["feature_catalog"].update_one(
                {"feature_key": doc["feature_key"]},
                {"$setOnInsert": doc},
                upsert=True,
            )
            if result.upserted_id is not None:
                inserted_count += 1
            else:
                existing_count += 1
        return FeatureSeedResponse(
            inserted_count=inserted_count,
            existing_count=existing_count,
            total_defaults=len(demos),
        )

    def _default_demo_catalog(self) -> list[dict[str, Any]]:
        """Build default local feature catalog rows."""
        now = datetime.now(UTC)
        return [
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
                "_id": "feat_competitions",
                "feature_key": "competitions",
                "title": "Online Competition",
                "description": "Host and join practical competitions with measurable outcomes.",
                "enabled": True,
                "beta": False,
                "sort_order": 30,
                "route_path": "/features/competitions",
                "capability_requirements": {
                    "view": ["content:read"],
                    "join": ["community:write"],
                    "create": ["community:manage"],
                    "manage": ["community:manage"],
                },
                "created_at": now,
                "updated_at": now,
            },
            {
                "_id": "feat_tutorials",
                "feature_key": "tutorials",
                "title": "Tutorial",
                "description": "Guided tutorials and structured practice paths.",
                "enabled": True,
                "beta": False,
                "sort_order": 40,
                "route_path": "/features/tutorials",
                "capability_requirements": {
                    "view": ["content:read"],
                    "join": ["course:learn"],
                    "create": ["course:teach"],
                    "manage": ["course:manage"],
                },
                "created_at": now,
                "updated_at": now,
            },
            {
                "_id": "feat_research",
                "feature_key": "research",
                "title": "R&D",
                "description": "Collaborative research workspace and experiment tracking.",
                "enabled": True,
                "beta": False,
                "sort_order": 50,
                "route_path": "/features/research",
                "capability_requirements": {
                    "view": ["content:read"],
                    "join": ["community:write"],
                    "create": ["community:manage"],
                    "manage": ["community:manage"],
                },
                "created_at": now,
                "updated_at": now,
            },
            {
                "_id": "feat_rent_lab",
                "feature_key": "rent_lab",
                "title": "Laboratory",
                "description": "Laboratory usage, booking, and operational coordination.",
                "enabled": True,
                "beta": False,
                "sort_order": 60,
                "route_path": "/features/rent-lab",
                "capability_requirements": {
                    "view": ["lab:read"],
                    "join": ["lab:bookings:create"],
                    "create": ["lab:manage"],
                    "manage": ["lab:manage"],
                },
                "created_at": now,
                "updated_at": now,
            },
            {
                "_id": "feat_certification",
                "feature_key": "certification",
                "title": "Certification",
                "description": "Issue, track, and verify learning certifications.",
                "enabled": True,
                "beta": False,
                "sort_order": 70,
                "route_path": "/features/certification",
                "capability_requirements": {
                    "view": ["content:read"],
                    "join": ["course:learn"],
                    "create": ["course:teach"],
                    "manage": ["course:manage"],
                },
                "created_at": now,
                "updated_at": now,
            },
            {
                "_id": "feat_chatroom",
                "feature_key": "chatroom",
                "title": "Chatroom",
                "description": "Real-time group conversations and classroom communication.",
                "enabled": True,
                "beta": False,
                "sort_order": 80,
                "route_path": "/features/chatroom",
                "capability_requirements": {
                    "view": ["community:write"],
                    "join": ["community:write"],
                    "create": ["community:write"],
                    "manage": ["community:manage"],
                },
                "created_at": now,
                "updated_at": now,
            },
            {
                "_id": "feat_planner",
                "feature_key": "planner",
                "title": "Planner",
                "description": "Plan tasks, schedules, and academic milestones.",
                "enabled": True,
                "beta": False,
                "sort_order": 90,
                "route_path": "/features/planner",
                "capability_requirements": {
                    "view": ["content:read"],
                    "join": ["content:read"],
                    "create": ["content:write"],
                    "manage": ["org:manage"],
                },
                "created_at": now,
                "updated_at": now,
            },
            {
                "_id": "feat_specialization",
                "feature_key": "specialization",
                "title": "Specialization",
                "description": "Advanced specialization tracks for focused learning.",
                "enabled": True,
                "beta": False,
                "sort_order": 100,
                "route_path": "/features/specialization",
                "capability_requirements": {
                    "view": ["course:learn", "course:teach", "course:manage"],
                    "join": ["course:learn"],
                    "create": ["course:teach"],
                    "manage": ["course:manage"],
                },
                "created_at": now,
                "updated_at": now,
            },
        ]

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
