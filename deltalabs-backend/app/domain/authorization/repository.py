"""MongoDB repository for tenant authz data."""

from __future__ import annotations

from datetime import UTC, datetime
from typing import Any
from uuid import uuid4

from motor.motor_asyncio import AsyncIOMotorDatabase
from pymongo import ASCENDING

from app.domain.authorization.schemas import RelationshipType, ScopeType


# ################################ REPOSITORY ################################
# Mongo persistence operations for orgs, memberships, roles, and relationships.
class Repository:
    """Persistence operations for org membership, roles and relationships."""

    def __init__(self, db: AsyncIOMotorDatabase[dict[str, Any]]) -> None:
        self._db = db

    async def ensure_indexes(self) -> None:
        await self._db["orgs"].create_index([("slug", ASCENDING)], unique=True)
        await self._db["org_memberships"].create_index(
            [("org_id", ASCENDING), ("user_id", ASCENDING)],
            unique=True,
            name="uq_org_membership",
        )
        await self._db["org_memberships"].create_index(
            [("org_id", ASCENDING), ("status", ASCENDING)],
            name="ix_org_membership_status",
        )
        await self._db["role_definitions"].create_index(
            [("role_key", ASCENDING)],
            unique=True,
            name="uq_role_definition",
        )
        await self._db["role_bindings"].create_index(
            [
                ("org_id", ASCENDING),
                ("subject_user_id", ASCENDING),
                ("scope_type", ASCENDING),
                ("scope_id", ASCENDING),
                ("role_key", ASCENDING),
            ],
            unique=True,
            name="uq_role_binding",
        )
        await self._db["role_bindings"].create_index(
            [
                ("org_id", ASCENDING),
                ("subject_user_id", ASCENDING),
                ("scope_type", ASCENDING),
                ("scope_id", ASCENDING),
            ],
            name="ix_role_binding_lookup",
        )
        await self._db["relationships"].create_index(
            [
                ("org_id", ASCENDING),
                ("relation", ASCENDING),
                ("from_user_id", ASCENDING),
                ("to_user_id", ASCENDING),
            ],
            unique=True,
            name="uq_relationship",
        )

    async def find_membership(self, *, org_id: str, user_id: str) -> dict[str, Any] | None:
        return await self._db["org_memberships"].find_one(
            {"org_id": org_id, "user_id": user_id, "status": "active"}
        )

    async def list_role_bindings(
        self,
        *,
        org_id: str,
        user_id: str,
        scope_pairs: list[tuple[ScopeType, str]],
    ) -> list[dict[str, Any]]:
        ors: list[dict[str, Any]] = []
        for scope_type, scope_id in scope_pairs:
            ors.append({"scope_type": scope_type, "scope_id": scope_id})
        if not ors:
            return []
        cursor = self._db["role_bindings"].find(
            {"org_id": org_id, "subject_user_id": user_id, "$or": ors}
        )
        return await cursor.to_list(length=200)

    async def list_role_definitions_for_keys(self, role_keys: list[str]) -> list[dict[str, Any]]:
        if not role_keys:
            return []
        cursor = self._db["role_definitions"].find({"role_key": {"$in": role_keys}})
        return await cursor.to_list(length=200)

    async def list_role_bindings_for_user_in_org(
        self,
        *,
        org_id: str,
        user_id: str,
    ) -> list[dict[str, Any]]:
        cursor = self._db["role_bindings"].find(
            {
                "org_id": org_id,
                "subject_user_id": user_id,
            }
        )
        return await cursor.to_list(length=500)

    async def has_relationship(
        self,
        *,
        org_id: str,
        relation: RelationshipType,
        from_user_id: str,
        to_user_id: str,
    ) -> bool:
        doc = await self._db["relationships"].find_one(
            {
                "org_id": org_id,
                "relation": relation,
                "from_user_id": from_user_id,
                "to_user_id": to_user_id,
            }
        )
        return doc is not None

    async def upsert_default_org(self, *, slug: str, name: str) -> dict[str, Any]:
        now = datetime.now(UTC)
        existing = await self._db["orgs"].find_one({"slug": slug})
        if existing is not None:
            return existing
        document = {
            "_id": str(uuid4()),
            "slug": slug,
            "name": name,
            "is_active": True,
            "created_at": now,
            "updated_at": now,
        }
        await self._db["orgs"].insert_one(document)
        return document

    async def find_org_by_slug(self, slug: str) -> dict[str, Any] | None:
        return await self._db["orgs"].find_one({"slug": slug})

    async def find_org_by_id(self, org_id: str) -> dict[str, Any] | None:
        return await self._db["orgs"].find_one({"_id": org_id})

    async def create_org(self, *, slug: str, name: str) -> dict[str, Any]:
        now = datetime.now(UTC)
        document = {
            "_id": str(uuid4()),
            "slug": slug,
            "name": name,
            "is_active": True,
            "created_at": now,
            "updated_at": now,
        }
        await self._db["orgs"].insert_one(document)
        return document

    async def list_orgs_for_user(self, *, user_id: str) -> list[dict[str, Any]]:
        memberships = (
            await self._db["org_memberships"]
            .find({"user_id": user_id, "status": "active"})
            .to_list(length=500)
        )
        org_ids = [str(m["org_id"]) for m in memberships]
        if not org_ids:
            return []
        orgs = await self._db["orgs"].find({"_id": {"$in": org_ids}}).to_list(length=500)
        by_id = {str(o["_id"]): o for o in orgs}
        return [by_id[oid] for oid in org_ids if oid in by_id]

    async def upsert_membership(
        self,
        *,
        org_id: str,
        user_id: str,
        status: str = "active",
    ) -> None:
        now = datetime.now(UTC)
        await self._db["org_memberships"].update_one(
            {"org_id": org_id, "user_id": user_id},
            {
                "$set": {"status": status, "updated_at": now},
                "$setOnInsert": {"created_at": now},
            },
            upsert=True,
        )

    async def upsert_role_binding(
        self,
        *,
        org_id: str,
        user_id: str,
        role_key: str,
        scope_type: ScopeType,
        scope_id: str,
    ) -> None:
        now = datetime.now(UTC)
        await self._db["role_bindings"].update_one(
            {
                "org_id": org_id,
                "subject_user_id": user_id,
                "role_key": role_key,
                "scope_type": scope_type,
                "scope_id": scope_id,
            },
            {
                "$set": {"updated_at": now},
                "$setOnInsert": {"created_at": now},
            },
            upsert=True,
        )

    async def upsert_role_definition(
        self,
        *,
        role_key: str,
        title: str,
        permissions: list[str],
        description: str | None = None,
        membership_state: str = "member",
        membership_rank: int = 1,
    ) -> None:
        now = datetime.now(UTC)
        await self._db["role_definitions"].update_one(
            {"role_key": role_key},
            {
                "$set": {
                    "title": title,
                    "permissions": permissions,
                    "description": description,
                    "membership_state": membership_state,
                    "membership_rank": membership_rank,
                    "updated_at": now,
                },
                "$setOnInsert": {"created_at": now},
            },
            upsert=True,
        )


# ################################ /REPOSITORY ################################
