"""Mongo persistence for management table definitions, instances, and rows."""

from __future__ import annotations

from datetime import UTC, datetime
from typing import Any
from uuid import uuid4

from motor.motor_asyncio import AsyncIOMotorDatabase
from pymongo import ASCENDING, DESCENDING

from app.domain.management_table.schemas import MANAGEMENT_TABLE_DEFAULT_GROUP_ID


def _new_id(prefix: str) -> str:
    return f"{prefix}_{uuid4().hex}"


class ManagementTableRepository:
    def __init__(self, db: AsyncIOMotorDatabase[dict[str, Any]]) -> None:
        self._db = db

    async def ensure_indexes(self) -> None:
        defs_col = self._db["school_management_table_definitions"]
        inst_col = self._db["school_management_table_instances"]
        rows_col = self._db["school_management_table_rows"]
        await defs_col.create_index(
            [("org_id", ASCENDING), ("school_id", ASCENDING), ("updated_at", DESCENDING)],
            name="ix_mgmt_defs_org_school_updated",
        )
        await inst_col.create_index(
            [("org_id", ASCENDING), ("school_id", ASCENDING), ("updated_at", DESCENDING)],
            name="ix_mgmt_inst_org_school_updated",
        )
        await inst_col.create_index(
            [("workspace_item_id", ASCENDING)],
            name="ix_mgmt_inst_workspace_item",
            sparse=True,
        )
        await inst_col.create_index(
            [("org_id", ASCENDING), ("school_id", ASCENDING), ("workspace_item_id", ASCENDING), ("table_kind", ASCENDING)],
            name="ix_mgmt_inst_workspace_kind",
            sparse=True,
        )
        await rows_col.create_index(
            [("instance_id", ASCENDING), ("position", ASCENDING)],
            name="ix_mgmt_rows_instance_position",
        )
        await rows_col.create_index(
            [("instance_id", ASCENDING), ("group_id", ASCENDING), ("position", ASCENDING)],
            name="ix_mgmt_rows_instance_group_position",
        )

    async def insert_definition(
        self,
        *,
        org_id: str,
        school_id: str,
        title: str,
        visibility: str,
        created_by_user_id: str,
        columns: list[dict[str, Any]],
        source_definition_id: str | None = None,
    ) -> dict[str, Any]:
        now = datetime.now(UTC)
        doc = {
            "_id": _new_id("mtd"),
            "org_id": org_id,
            "school_id": school_id,
            "title": title.strip(),
            "visibility": visibility,
            "source_definition_id": source_definition_id,
            "version": 1,
            "columns": columns,
            "created_by_user_id": created_by_user_id,
            "created_at": now,
            "updated_at": now,
        }
        await self._db["school_management_table_definitions"].insert_one(doc)
        return doc

    async def find_definition(self, *, org_id: str, school_id: str, definition_id: str) -> dict[str, Any] | None:
        return await self._db["school_management_table_definitions"].find_one(
            {"_id": definition_id, "org_id": org_id, "school_id": school_id},
        )

    async def list_definitions_for_school(
        self,
        *,
        org_id: str,
        school_id: str,
        scope: str,
        user_id: str,
    ) -> list[dict[str, Any]]:
        query: dict[str, Any] = {"org_id": org_id, "school_id": school_id}
        if scope == "template":
            query["visibility"] = "sharable"
        elif scope == "mine":
            query["created_by_user_id"] = user_id
        cursor = self._db["school_management_table_definitions"].find(query).sort(
            [("updated_at", DESCENDING)],
        )
        return await cursor.to_list(length=500)

    async def update_definition(
        self,
        *,
        org_id: str,
        school_id: str,
        definition_id: str,
        title: str | None,
        visibility: str | None,
        columns: list[dict[str, Any]] | None,
    ) -> bool:
        now = datetime.now(UTC)
        set_fields: dict[str, Any] = {"updated_at": now}
        if title is not None:
            set_fields["title"] = title.strip()
        if visibility is not None:
            set_fields["visibility"] = visibility
        if columns is not None:
            set_fields["columns"] = columns
        op: dict[str, Any] = {"$set": set_fields}
        if columns is not None:
            op["$inc"] = {"version": 1}
        result = await self._db["school_management_table_definitions"].update_one(
            {"_id": definition_id, "org_id": org_id, "school_id": school_id},
            op,
        )
        return result.matched_count > 0

    async def insert_instance(
        self,
        *,
        org_id: str,
        school_id: str,
        definition_id: str,
        definition_version: int,
        title: str,
        workspace_item_id: str | None,
        table_kind: str | None = None,
    ) -> dict[str, Any]:
        now = datetime.now(UTC)
        doc = {
            "_id": _new_id("mti"),
            "org_id": org_id,
            "school_id": school_id,
            "definition_id": definition_id,
            "definition_version": definition_version,
            "workspace_item_id": workspace_item_id,
            "title": title.strip(),
            "table_groups": [
                {
                    "id": MANAGEMENT_TABLE_DEFAULT_GROUP_ID,
                    "title": "Main Table",
                    "order": 0,
                },
            ],
            "created_at": now,
            "updated_at": now,
        }
        if table_kind:
            doc["table_kind"] = table_kind
        await self._db["school_management_table_instances"].insert_one(doc)
        return doc

    async def find_instance(self, *, org_id: str, school_id: str, instance_id: str) -> dict[str, Any] | None:
        return await self._db["school_management_table_instances"].find_one(
            {"_id": instance_id, "org_id": org_id, "school_id": school_id},
        )

    def _workspace_kind_filter(self, *, workspace_item_id: str, table_kind: str | None) -> dict[str, Any]:
        base: dict[str, Any] = {"workspace_item_id": workspace_item_id}
        kind = (table_kind or "").strip()
        if not kind or kind == "management":
            base["$or"] = [
                {"table_kind": {"$exists": False}},
                {"table_kind": None},
                {"table_kind": ""},
                {"table_kind": "management"},
            ]
        else:
            base["table_kind"] = kind
        return base

    async def find_instance_by_workspace_item(
        self,
        *,
        org_id: str,
        school_id: str,
        workspace_item_id: str,
        table_kind: str | None = None,
    ) -> dict[str, Any] | None:
        query: dict[str, Any] = {
            "org_id": org_id,
            "school_id": school_id,
            **self._workspace_kind_filter(workspace_item_id=workspace_item_id, table_kind=table_kind),
        }
        return await self._db["school_management_table_instances"].find_one(query)

    async def find_instance_by_definition(
        self,
        *,
        org_id: str,
        school_id: str,
        definition_id: str,
        table_kind: str | None = None,
    ) -> dict[str, Any] | None:
        """Locate the instance that uses a given definition (used to re-sync rows after column changes)."""
        query: dict[str, Any] = {
            "org_id": org_id,
            "school_id": school_id,
            "definition_id": definition_id,
        }
        if table_kind is not None:
            query["table_kind"] = table_kind
        return await self._db["school_management_table_instances"].find_one(query)

    def _rows_filter(self, *, org_id: str, school_id: str, instance_id: str, group_id: str) -> dict[str, Any]:
        base: dict[str, Any] = {"org_id": org_id, "school_id": school_id, "instance_id": instance_id}
        if group_id == MANAGEMENT_TABLE_DEFAULT_GROUP_ID:
            base["$or"] = [
                {"group_id": {"$exists": False}},
                {"group_id": None},
                {"group_id": ""},
                {"group_id": MANAGEMENT_TABLE_DEFAULT_GROUP_ID},
            ]
        else:
            base["group_id"] = group_id
        return base

    async def append_table_group(
        self,
        *,
        org_id: str,
        school_id: str,
        instance_id: str,
        title: str,
    ) -> dict[str, Any] | None:
        inst = await self.find_instance(org_id=org_id, school_id=school_id, instance_id=instance_id)
        if inst is None:
            return None
        groups_raw = inst.get("table_groups")
        groups: list[dict[str, Any]] = [dict(g) for g in groups_raw] if isinstance(groups_raw, list) else []
        if not groups:
            groups = [{"id": MANAGEMENT_TABLE_DEFAULT_GROUP_ID, "title": "Main Table", "order": 0}]
        new_id = _new_id("mtg")
        next_order = max((int(g.get("order", 0)) for g in groups), default=-1) + 1
        new_group = {"id": new_id, "title": title.strip(), "order": next_order}
        groups.append(new_group)
        now = datetime.now(UTC)
        result = await self._db["school_management_table_instances"].update_one(
            {"_id": instance_id, "org_id": org_id, "school_id": school_id},
            {"$set": {"table_groups": groups, "updated_at": now}},
        )
        if result.matched_count < 1:
            return None
        return new_group

    async def list_rows(
        self,
        *,
        org_id: str,
        school_id: str,
        instance_id: str,
        group_id: str,
        skip: int,
        limit: int,
    ) -> tuple[list[dict[str, Any]], int]:
        filt = self._rows_filter(org_id=org_id, school_id=school_id, instance_id=instance_id, group_id=group_id)
        total = await self._db["school_management_table_rows"].count_documents(filt)
        cursor = (
            self._db["school_management_table_rows"]
            .find(filt)
            .sort([("position", ASCENDING), ("created_at", ASCENDING)])
            .skip(skip)
            .limit(limit)
        )
        items = await cursor.to_list(length=limit)
        return items, total

    async def insert_row(
        self,
        *,
        org_id: str,
        school_id: str,
        instance_id: str,
        group_id: str,
        position: int,
        cells: dict[str, Any],
        parent_row_id: str | None = None,
    ) -> dict[str, Any]:
        now = datetime.now(UTC)
        doc: dict[str, Any] = {
            "_id": _new_id("mtr"),
            "org_id": org_id,
            "school_id": school_id,
            "instance_id": instance_id,
            "group_id": group_id,
            "position": position,
            "cells": cells,
            "created_at": now,
            "updated_at": now,
        }
        if parent_row_id:
            doc["parent_row_id"] = parent_row_id
        await self._db["school_management_table_rows"].insert_one(doc)
        return doc

    async def delete_row(
        self,
        *,
        org_id: str,
        school_id: str,
        instance_id: str,
        row_id: str,
    ) -> bool:
        result = await self._db["school_management_table_rows"].delete_one(
            {
                "_id": row_id,
                "org_id": org_id,
                "school_id": school_id,
                "instance_id": instance_id,
            },
        )
        return result.deleted_count > 0

    async def update_row_parent(
        self,
        *,
        org_id: str,
        school_id: str,
        instance_id: str,
        row_id: str,
        parent_row_id: str | None,
    ) -> bool:
        now = datetime.now(UTC)
        if parent_row_id:
            update: dict[str, Any] = {
                "$set": {"parent_row_id": parent_row_id, "updated_at": now},
            }
        else:
            update = {"$unset": {"parent_row_id": ""}, "$set": {"updated_at": now}}
        result = await self._db["school_management_table_rows"].update_one(
            {
                "_id": row_id,
                "org_id": org_id,
                "school_id": school_id,
                "instance_id": instance_id,
            },
            update,
        )
        return result.matched_count > 0

    async def find_row(
        self,
        *,
        org_id: str,
        school_id: str,
        instance_id: str,
        row_id: str,
    ) -> dict[str, Any] | None:
        return await self._db["school_management_table_rows"].find_one(
            {
                "_id": row_id,
                "org_id": org_id,
                "school_id": school_id,
                "instance_id": instance_id,
            },
        )

    async def update_row_cells(
        self,
        *,
        org_id: str,
        school_id: str,
        instance_id: str,
        row_id: str,
        cells: dict[str, Any],
    ) -> bool:
        now = datetime.now(UTC)
        result = await self._db["school_management_table_rows"].update_one(
            {
                "_id": row_id,
                "org_id": org_id,
                "school_id": school_id,
                "instance_id": instance_id,
            },
            {"$set": {"cells": cells, "updated_at": now}},
        )
        return result.matched_count > 0

    async def set_row_linked_battle(
        self,
        *,
        org_id: str,
        school_id: str,
        instance_id: str,
        row_id: str,
        linked_battle_id: str | None,
    ) -> bool:
        """Persist which hosted battle a row is linked to (for re-sync)."""
        now = datetime.now(UTC)
        result = await self._db["school_management_table_rows"].update_one(
            {
                "_id": row_id,
                "org_id": org_id,
                "school_id": school_id,
                "instance_id": instance_id,
            },
            {
                "$set": {
                    "linked_battle_id": linked_battle_id or None,
                    "updated_at": now,
                }
            },
        )
        return result.matched_count > 0

    async def list_linked_rows(
        self,
        *,
        org_id: str,
        school_id: str,
        instance_id: str,
    ) -> list[dict[str, Any]]:
        """Return rows that are linked to a hosted battle (linked_battle_id set)."""
        docs = await self._db["school_management_table_rows"].find(
            {
                "org_id": org_id,
                "school_id": school_id,
                "instance_id": instance_id,
                "linked_battle_id": {"$ne": None},
            }
        ).to_list(length=500)
        return [dict(d) for d in docs]

    async def max_row_position(
        self,
        *,
        org_id: str,
        school_id: str,
        instance_id: str,
        group_id: str,
    ) -> int | None:
        filt = self._rows_filter(org_id=org_id, school_id=school_id, instance_id=instance_id, group_id=group_id)
        doc = await self._db["school_management_table_rows"].find_one(
            filt,
            sort=[("position", DESCENDING)],
            projection={"position": 1},
        )
        if doc is None:
            return None
        return int(doc.get("position", 0))

    async def update_row_position(
        self,
        *,
        org_id: str,
        school_id: str,
        instance_id: str,
        row_id: str,
        position: int,
    ) -> bool:
        now = datetime.now(UTC)
        result = await self._db["school_management_table_rows"].update_one(
            {
                "_id": row_id,
                "org_id": org_id,
                "school_id": school_id,
                "instance_id": instance_id,
            },
            {"$set": {"position": position, "updated_at": now}},
        )
        return result.matched_count > 0

    async def list_sibling_rows(
        self,
        *,
        org_id: str,
        school_id: str,
        instance_id: str,
        group_id: str,
        parent_row_id: str | None,
    ) -> list[dict[str, Any]]:
        base = self._rows_filter(org_id=org_id, school_id=school_id, instance_id=instance_id, group_id=group_id)
        if parent_row_id:
            filt: dict[str, Any] = {**base, "parent_row_id": parent_row_id}
        else:
            root_parent = {
                "$or": [
                    {"parent_row_id": {"$exists": False}},
                    {"parent_row_id": None},
                    {"parent_row_id": ""},
                ],
            }
            filt = {"$and": [base, root_parent]}
        cursor = (
            self._db["school_management_table_rows"]
            .find(filt)
            .sort([("position", ASCENDING), ("created_at", ASCENDING)])
        )
        return await cursor.to_list(length=2000)

    async def delete_rows_by_ids(
        self,
        *,
        org_id: str,
        school_id: str,
        instance_id: str,
        row_ids: list[str],
    ) -> int:
        if not row_ids:
            return 0
        result = await self._db["school_management_table_rows"].delete_many(
            {
                "_id": {"$in": row_ids},
                "org_id": org_id,
                "school_id": school_id,
                "instance_id": instance_id,
            },
        )
        return int(result.deleted_count)
