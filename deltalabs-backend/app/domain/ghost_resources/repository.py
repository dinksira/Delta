"""Mongo persistence for school Ghost Resources."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any
from uuid import uuid4

from motor.motor_asyncio import AsyncIOMotorDatabase
from pymongo import ASCENDING, DESCENDING, ReturnDocument


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def new_ghost_id() -> str:
    return f"ghi_{uuid4().hex}"


def new_variant_id() -> str:
    return f"ghv_{uuid4().hex}"


def new_edge_id() -> str:
    return f"ghe_{uuid4().hex}"


def new_event_id() -> str:
    return f"gev_{uuid4().hex}"


class GhostResourcesRepository:
    def __init__(self, db: AsyncIOMotorDatabase[dict[str, object]]) -> None:
        self._db = db

    async def ensure_indexes(self) -> None:
        instances = self._db["school_ghost_instances"]
        await instances.create_index(
            [
                ("org_id", ASCENDING),
                ("school_id", ASCENDING),
                ("host_type", ASCENDING),
                ("host_workspace_item_id", ASCENDING),
                ("status", ASCENDING),
            ],
            name="ix_ghost_instances_host",
        )
        await instances.create_index(
            [("org_id", ASCENDING), ("school_id", ASCENDING), ("created_at", DESCENDING)],
            name="ix_ghost_instances_created",
        )

        variants = self._db["school_ghost_variants"]
        await variants.create_index(
            [("ghost_id", ASCENDING), ("sort_order", ASCENDING)],
            name="ix_ghost_variants_ghost",
        )
        await variants.create_index(
            [("assignee_user_ids", ASCENDING)],
            name="ix_ghost_variants_assignees",
        )

        edges = self._db["school_ghost_chain_edges"]
        await edges.create_index([("ghost_id", ASCENDING)], name="ix_ghost_edges_ghost")
        await edges.create_index(
            [("ghost_id", ASCENDING), ("from_variant_id", ASCENDING), ("to_variant_id", ASCENDING)],
            unique=True,
            name="uq_ghost_edge",
        )

        events = self._db["school_ghost_events"]
        await events.create_index(
            [("ghost_id", ASCENDING), ("created_at", DESCENDING)],
            name="ix_ghost_events_ghost",
        )

    # —— instances ——

    async def insert_instance(self, doc: dict[str, Any]) -> dict[str, Any]:
        await self._db["school_ghost_instances"].insert_one(doc)
        return doc

    async def find_instance(
        self,
        *,
        org_id: str,
        school_id: str,
        ghost_id: str,
    ) -> dict[str, Any] | None:
        return await self._db["school_ghost_instances"].find_one(
            {"_id": ghost_id, "org_id": org_id, "school_id": school_id}
        )

    async def list_instances(
        self,
        *,
        org_id: str,
        school_id: str,
        host_type: str | None,
        host_workspace_item_id: str | None,
        status: str | None,
    ) -> tuple[list[dict[str, Any]], int]:
        filt: dict[str, Any] = {
            "org_id": org_id,
            "school_id": school_id,
            "status": {"$ne": "cancelled"} if status is None else status,
        }
        if host_type:
            filt["host_type"] = host_type
        if host_workspace_item_id:
            filt["host_workspace_item_id"] = host_workspace_item_id
        col = self._db["school_ghost_instances"]
        total = await col.count_documents(filt)
        cursor = col.find(filt).sort([("created_at", DESCENDING)])
        return [doc async for doc in cursor], total

    async def update_instance(
        self,
        *,
        org_id: str,
        school_id: str,
        ghost_id: str,
        patch: dict[str, Any],
    ) -> dict[str, Any] | None:
        patch = {**patch, "updated_at": _utcnow()}
        return await self._db["school_ghost_instances"].find_one_and_update(
            {"_id": ghost_id, "org_id": org_id, "school_id": school_id},
            {"$set": patch},
            return_document=ReturnDocument.AFTER,
        )

    # —— variants ——

    async def insert_variant(self, doc: dict[str, Any]) -> dict[str, Any]:
        await self._db["school_ghost_variants"].insert_one(doc)
        return doc

    async def find_variant(self, *, ghost_id: str, variant_id: str) -> dict[str, Any] | None:
        return await self._db["school_ghost_variants"].find_one(
            {"_id": variant_id, "ghost_id": ghost_id}
        )

    async def list_variants(self, *, ghost_id: str) -> list[dict[str, Any]]:
        cursor = self._db["school_ghost_variants"].find({"ghost_id": ghost_id}).sort(
            [("sort_order", ASCENDING), ("created_at", ASCENDING)]
        )
        return [doc async for doc in cursor]

    async def update_variant(
        self,
        *,
        ghost_id: str,
        variant_id: str,
        patch: dict[str, Any],
    ) -> dict[str, Any] | None:
        patch = {**patch, "updated_at": _utcnow()}
        return await self._db["school_ghost_variants"].find_one_and_update(
            {"_id": variant_id, "ghost_id": ghost_id},
            {"$set": patch},
            return_document=ReturnDocument.AFTER,
        )

    async def count_variants(self, *, ghost_id: str) -> int:
        return await self._db["school_ghost_variants"].count_documents({"ghost_id": ghost_id})

    # —— edges ——

    async def insert_edge(self, doc: dict[str, Any]) -> dict[str, Any]:
        await self._db["school_ghost_chain_edges"].insert_one(doc)
        return doc

    async def list_edges(self, *, ghost_id: str) -> list[dict[str, Any]]:
        cursor = self._db["school_ghost_chain_edges"].find({"ghost_id": ghost_id}).sort(
            [("created_at", ASCENDING)]
        )
        return [doc async for doc in cursor]

    async def find_edge(self, *, ghost_id: str, edge_id: str) -> dict[str, Any] | None:
        return await self._db["school_ghost_chain_edges"].find_one(
            {"_id": edge_id, "ghost_id": ghost_id}
        )

    async def delete_edge(self, *, ghost_id: str, edge_id: str) -> bool:
        res = await self._db["school_ghost_chain_edges"].delete_one(
            {"_id": edge_id, "ghost_id": ghost_id}
        )
        return res.deleted_count > 0

    async def count_edges(self, *, ghost_id: str) -> int:
        return await self._db["school_ghost_chain_edges"].count_documents({"ghost_id": ghost_id})

    async def list_variants_for_assignee(
        self,
        *,
        org_id: str,
        school_id: str,
        user_id: str,
    ) -> list[dict[str, Any]]:
        """Variants assigned to user; filter by school via parent ghost join in service."""
        cursor = self._db["school_ghost_variants"].find(
            {"assignee_user_ids": user_id}
        ).sort([("updated_at", DESCENDING)])
        return [doc async for doc in cursor]

    # —— events ——

    async def insert_event(self, doc: dict[str, Any]) -> dict[str, Any]:
        await self._db["school_ghost_events"].insert_one(doc)
        return doc

    async def list_events(
        self,
        *,
        ghost_id: str,
        limit: int = 50,
    ) -> tuple[list[dict[str, Any]], int]:
        col = self._db["school_ghost_events"]
        filt = {"ghost_id": ghost_id}
        total = await col.count_documents(filt)
        cursor = col.find(filt).sort([("created_at", DESCENDING)]).limit(limit)
        return [doc async for doc in cursor], total
