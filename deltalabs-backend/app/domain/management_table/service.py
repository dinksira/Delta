"""Business logic for management tables."""

from __future__ import annotations

from typing import Any, Mapping
from uuid import uuid4

from app.core.exceptions import NotFoundError, PermissionDeniedError, ValidationError
from app.domain.management_table.repository import ManagementTableRepository
from app.domain.management_table.schemas import (
    MANAGEMENT_TABLE_DEFAULT_GROUP_ID,
    MANAGEMENT_TABLE_KIND_ASSIGNMENTS,
    MANAGEMENT_TABLE_KIND_GHOSTS,
    MANAGEMENT_TABLE_KIND_GRADES,
    MANAGEMENT_TABLE_KIND_LEAVE_REQUESTS,
    MANAGEMENT_TABLE_KIND_MANAGEMENT,
    MANAGEMENT_TABLE_KIND_PARENTS,
    MANAGEMENT_TABLE_KIND_SCHEDULES,
    MANAGEMENT_TABLE_KIND_STUDENTS,
    MANAGEMENT_TABLE_KIND_TEACHERS,
    ManagementTableColumnAppendInput,
    ManagementTableColumnPatchInput,
    ManagementTableDefinitionCreateInput,
    ManagementTableDefinitionInheritInput,
    ManagementTableDefinitionListResponse,
    ManagementTableDefinitionPublic,
    ManagementTableDefinitionUpdateInput,
    ManagementTableGroupPublic,
    ManagementTableInstanceBundleResponse,
    ManagementTableInstanceCreateInput,
    ManagementTableRowCellsPatchInput,
    ManagementTableRowListResponse,
    ManagementTableRowMoveInput,
    ManagementTableRowPublic,
    ManagementTableTableGroupCreateInput,
    ManagementTableWorkspaceBootstrapResponse,
    map_definition,
    map_instance,
    map_row,
)
from app.domain.school.schemas import LeaveRequestSubmitInput
from app.domain.school.repository import Repository as SchoolRepository

_ALLOWED_COLUMN_TYPES = frozenset(
    {"text", "textarea", "number", "date", "checkbox", "dropdown", "status", "link", "phone"}
)


def _new_column_id() -> str:
    return f"col_{uuid4().hex[:12]}"


def _normalize_column_type(raw: str) -> str:
    t = raw.strip().lower()
    if t not in _ALLOWED_COLUMN_TYPES:
        raise ValidationError(f"Unsupported column type: {raw}", code="management_table_column_type_invalid")
    return t


def _normalize_table_kind(raw: str | None) -> str | None:
    if raw is None:
        return None
    kind = raw.strip()
    return kind or None


def _instance_table_kind(doc: Mapping[str, Any]) -> str:
    raw = doc.get("table_kind")
    if isinstance(raw, str) and raw.strip():
        return raw.strip()
    return MANAGEMENT_TABLE_KIND_MANAGEMENT


def _instance_matches_table_kind(doc: Mapping[str, Any], expected_kind: str | None) -> bool:
    expected = _normalize_table_kind(expected_kind) or MANAGEMENT_TABLE_KIND_MANAGEMENT
    return _instance_table_kind(doc) == expected


class ManagementTableService:
    def __init__(
        self,
        *,
        mt_repo: ManagementTableRepository,
        school_repo: SchoolRepository,
    ) -> None:
        self._mt = mt_repo
        self._school = school_repo

    async def _require_school(self, *, org_id: str, school_id: str) -> None:
        doc = await self._school.find_school(org_id=org_id, school_id=school_id)
        if doc is None:
            raise NotFoundError("School not found.", code="school_not_found")

    async def _load_bootstrap_bundle_if_valid(
        self,
        *,
        org_id: str,
        school_id: str,
        instance_id: str,
        table_kind: str,
    ) -> ManagementTableInstanceBundleResponse | None:
        inst = await self._mt.find_instance(
            org_id=org_id,
            school_id=school_id,
            instance_id=instance_id.strip(),
        )
        if inst is None or not _instance_matches_table_kind(inst, table_kind):
            return None
        return await self.get_instance_bundle(
            org_id=org_id,
            school_id=school_id,
            instance_id=instance_id.strip(),
        )

    async def list_definitions(
        self,
        *,
        org_id: str,
        school_id: str,
        user_id: str,
        scope: str,
    ) -> ManagementTableDefinitionListResponse:
        await self._require_school(org_id=org_id, school_id=school_id)
        if scope not in ("all", "template", "mine"):
            scope = "all"
        docs = await self._mt.list_definitions_for_school(
            org_id=org_id,
            school_id=school_id,
            scope=scope,
            user_id=user_id,
        )
        return ManagementTableDefinitionListResponse(items=[map_definition(d) for d in docs])

    async def create_definition(
        self,
        *,
        org_id: str,
        school_id: str,
        user_id: str,
        payload: ManagementTableDefinitionCreateInput,
    ) -> ManagementTableDefinitionPublic:
        await self._require_school(org_id=org_id, school_id=school_id)
        starter = [
            {
                "id": _new_column_id(),
                "title": "Name",
                "type": "text",
                "order": 0,
                "settings": {},
            }
        ]
        doc = await self._mt.insert_definition(
            org_id=org_id,
            school_id=school_id,
            title=payload.title,
            visibility=payload.visibility,
            created_by_user_id=user_id,
            columns=starter,
        )
        return map_definition(doc)

    async def get_definition(
        self,
        *,
        org_id: str,
        school_id: str,
        definition_id: str,
    ) -> ManagementTableDefinitionPublic:
        await self._require_school(org_id=org_id, school_id=school_id)
        doc = await self._mt.find_definition(org_id=org_id, school_id=school_id, definition_id=definition_id)
        if doc is None:
            raise NotFoundError("Table definition not found.", code="management_table_definition_not_found")
        return map_definition(doc)

    async def update_definition(
        self,
        *,
        org_id: str,
        school_id: str,
        definition_id: str,
        payload: ManagementTableDefinitionUpdateInput,
    ) -> ManagementTableDefinitionPublic:
        await self._require_school(org_id=org_id, school_id=school_id)
        if payload.title is None and payload.visibility is None:
            raise ValidationError("No changes provided.", code="management_table_definition_update_empty")
        ok = await self._mt.update_definition(
            org_id=org_id,
            school_id=school_id,
            definition_id=definition_id,
            title=payload.title,
            visibility=payload.visibility,
            columns=None,
        )
        if not ok:
            raise NotFoundError("Table definition not found.", code="management_table_definition_not_found")
        return await self.get_definition(org_id=org_id, school_id=school_id, definition_id=definition_id)

    async def append_column(
        self,
        *,
        org_id: str,
        school_id: str,
        definition_id: str,
        payload: ManagementTableColumnAppendInput,
    ) -> ManagementTableDefinitionPublic:
        await self._require_school(org_id=org_id, school_id=school_id)
        doc = await self._mt.find_definition(org_id=org_id, school_id=school_id, definition_id=definition_id)
        if doc is None:
            raise NotFoundError("Table definition not found.", code="management_table_definition_not_found")
        col_type = _normalize_column_type(payload.type)
        raw_cols = doc.get("columns")
        existing: list[dict[str, Any]] = [dict(c) for c in raw_cols] if isinstance(raw_cols, list) else []
        max_order = max((int(c.get("order", 0)) for c in existing), default=-1)
        existing.append(
            {
                "id": _new_column_id(),
                "title": payload.title.strip(),
                "type": col_type,
                "order": max_order + 1,
                "settings": dict(payload.settings),
            }
        )
        ok = await self._mt.update_definition(
            org_id=org_id,
            school_id=school_id,
            definition_id=definition_id,
            title=None,
            visibility=None,
            columns=existing,
        )
        if not ok:
            raise NotFoundError("Table definition not found.", code="management_table_definition_not_found")
        return await self.get_definition(org_id=org_id, school_id=school_id, definition_id=definition_id)

    async def patch_column(
        self,
        *,
        org_id: str,
        school_id: str,
        definition_id: str,
        column_id: str,
        payload: ManagementTableColumnPatchInput,
    ) -> ManagementTableDefinitionPublic:
        await self._require_school(org_id=org_id, school_id=school_id)
        doc = await self._mt.find_definition(org_id=org_id, school_id=school_id, definition_id=definition_id)
        if doc is None:
            raise NotFoundError("Table definition not found.", code="management_table_definition_not_found")
        raw_cols = doc.get("columns")
        existing: list[dict[str, Any]] = [dict(c) for c in raw_cols] if isinstance(raw_cols, list) else []
        found = False
        for c in existing:
            if str(c.get("id")) == column_id:
                c["title"] = payload.title.strip()
                found = True
                break
        if not found:
            raise NotFoundError("Column not found.", code="management_table_column_not_found")
        ok = await self._mt.update_definition(
            org_id=org_id,
            school_id=school_id,
            definition_id=definition_id,
            title=None,
            visibility=None,
            columns=existing,
        )
        if not ok:
            raise NotFoundError("Table definition not found.", code="management_table_definition_not_found")
        return await self.get_definition(org_id=org_id, school_id=school_id, definition_id=definition_id)

    async def remove_column(
        self,
        *,
        org_id: str,
        school_id: str,
        definition_id: str,
        column_id: str,
    ) -> ManagementTableDefinitionPublic:
        await self._require_school(org_id=org_id, school_id=school_id)
        doc = await self._mt.find_definition(org_id=org_id, school_id=school_id, definition_id=definition_id)
        if doc is None:
            raise NotFoundError("Table definition not found.", code="management_table_definition_not_found")
        raw_cols = doc.get("columns")
        existing: list[dict[str, Any]] = [dict(c) for c in raw_cols] if isinstance(raw_cols, list) else []
        if len(existing) <= 1:
            raise ValidationError("Cannot remove the last column.", code="management_table_column_remove_last")
        new_cols = [c for c in existing if str(c.get("id")) != column_id]
        if len(new_cols) == len(existing):
            raise NotFoundError("Column not found.", code="management_table_column_not_found")
        ok = await self._mt.update_definition(
            org_id=org_id,
            school_id=school_id,
            definition_id=definition_id,
            title=None,
            visibility=None,
            columns=new_cols,
        )
        if not ok:
            raise NotFoundError("Table definition not found.", code="management_table_definition_not_found")
        return await self.get_definition(org_id=org_id, school_id=school_id, definition_id=definition_id)

    async def inherit_definition(
        self,
        *,
        org_id: str,
        school_id: str,
        user_id: str,
        source_definition_id: str,
        payload: ManagementTableDefinitionInheritInput,
    ) -> ManagementTableDefinitionPublic:
        await self._require_school(org_id=org_id, school_id=school_id)
        src = await self._mt.find_definition(
            org_id=org_id,
            school_id=school_id,
            definition_id=source_definition_id,
        )
        if src is None:
            raise NotFoundError("Source table definition not found.", code="management_table_definition_not_found")
        raw_cols = src.get("columns")
        new_cols: list[dict[str, Any]] = []
        if isinstance(raw_cols, list):
            for i, c in enumerate(raw_cols):
                if not isinstance(c, dict):
                    continue
                new_cols.append(
                    {
                        "id": _new_column_id(),
                        "title": str(c.get("title", "Column")),
                        "type": _normalize_column_type(str(c.get("type", "text"))),
                        "order": int(c.get("order", i)),
                        "settings": dict(c["settings"]) if isinstance(c.get("settings"), dict) else {},
                    }
                )
        if not new_cols:
            new_cols = [
                {"id": _new_column_id(), "title": "Name", "type": "text", "order": 0, "settings": {}},
            ]
        doc = await self._mt.insert_definition(
            org_id=org_id,
            school_id=school_id,
            title=payload.title,
            visibility=payload.visibility,
            created_by_user_id=user_id,
            columns=new_cols,
            source_definition_id=source_definition_id,
        )
        return map_definition(doc)

    async def create_instance(
        self,
        *,
        org_id: str,
        school_id: str,
        payload: ManagementTableInstanceCreateInput,
    ) -> ManagementTableInstanceBundleResponse:
        await self._require_school(org_id=org_id, school_id=school_id)
        def_doc = await self._mt.find_definition(
            org_id=org_id,
            school_id=school_id,
            definition_id=payload.definition_id,
        )
        if def_doc is None:
            raise NotFoundError("Table definition not found.", code="management_table_definition_not_found")
        version = int(def_doc.get("version", 1))
        title = payload.title.strip() if isinstance(payload.title, str) and payload.title.strip() else str(
            def_doc.get("title", "Table")
        )
        raw_ws = payload.workspace_item_id
        ws_id = raw_ws.strip() if isinstance(raw_ws, str) and raw_ws.strip() else None
        table_kind = _normalize_table_kind(payload.table_kind)
        if ws_id:
            existing = await self._mt.find_instance_by_workspace_item(
                org_id=org_id,
                school_id=school_id,
                workspace_item_id=ws_id,
                table_kind=table_kind,
            )
            if existing is not None:
                defn = await self.get_definition(
                    org_id=org_id,
                    school_id=school_id,
                    definition_id=str(existing["definition_id"]),
                )
                return ManagementTableInstanceBundleResponse(
                    instance=map_instance(existing),
                    definition=defn,
                )
        inst = await self._mt.insert_instance(
            org_id=org_id,
            school_id=school_id,
            definition_id=str(def_doc["_id"]),
            definition_version=version,
            title=title,
            workspace_item_id=ws_id,
            table_kind=table_kind,
        )
        return ManagementTableInstanceBundleResponse(
            instance=map_instance(inst),
            definition=map_definition(def_doc),
        )

    async def get_instance_bundle(
        self,
        *,
        org_id: str,
        school_id: str,
        instance_id: str,
    ) -> ManagementTableInstanceBundleResponse:
        await self._require_school(org_id=org_id, school_id=school_id)
        inst = await self._mt.find_instance(org_id=org_id, school_id=school_id, instance_id=instance_id)
        if inst is None:
            raise NotFoundError("Table instance not found.", code="management_table_instance_not_found")
        def_doc = await self._mt.find_definition(
            org_id=org_id,
            school_id=school_id,
            definition_id=str(inst["definition_id"]),
        )
        if def_doc is None:
            raise NotFoundError("Table definition not found.", code="management_table_definition_not_found")
        return ManagementTableInstanceBundleResponse(
            instance=map_instance(inst),
            definition=map_definition(def_doc),
        )

    async def list_rows(
        self,
        *,
        org_id: str,
        school_id: str,
        instance_id: str,
        group_id: str | None,
        page: int,
        page_size: int,
    ) -> ManagementTableRowListResponse:
        bundle = await self.get_instance_bundle(org_id=org_id, school_id=school_id, instance_id=instance_id)
        gid = (group_id or MANAGEMENT_TABLE_DEFAULT_GROUP_ID).strip() or MANAGEMENT_TABLE_DEFAULT_GROUP_ID
        allowed = {g.id for g in bundle.instance.table_groups}
        if gid not in allowed:
            raise ValidationError("Unknown table group.", code="management_table_group_invalid")
        skip = max(page - 1, 0) * page_size
        items, total = await self._mt.list_rows(
            org_id=org_id,
            school_id=school_id,
            instance_id=instance_id,
            group_id=gid,
            skip=skip,
            limit=page_size,
        )
        return ManagementTableRowListResponse(
            items=[map_row(r) for r in items],
            total=total,
        )

    async def create_row(
        self,
        *,
        org_id: str,
        school_id: str,
        instance_id: str,
        group_id: str | None = None,
    ) -> ManagementTableRowPublic:
        await self._assert_row_creation_allowed(
            org_id=org_id,
            school_id=school_id,
            instance_id=instance_id,
        )
        bundle = await self.get_instance_bundle(org_id=org_id, school_id=school_id, instance_id=instance_id)
        gid = (group_id or MANAGEMENT_TABLE_DEFAULT_GROUP_ID).strip() or MANAGEMENT_TABLE_DEFAULT_GROUP_ID
        allowed = {g.id for g in bundle.instance.table_groups}
        if gid not in allowed:
            raise ValidationError("Unknown table group.", code="management_table_group_invalid")
        col_ids = {c.id for c in bundle.definition.columns}
        max_pos = await self._mt.max_row_position(
            org_id=org_id,
            school_id=school_id,
            instance_id=instance_id,
            group_id=gid,
        )
        position = (max_pos + 1) if max_pos is not None else 0
        cells: dict[str, Any] = {}
        for c in bundle.definition.columns:
            if c.type == "checkbox":
                cells[c.id] = False
            elif c.type == "number":
                cells[c.id] = None
            else:
                cells[c.id] = ""
        cells = {k: v for k, v in cells.items() if k in col_ids}
        doc = await self._mt.insert_row(
            org_id=org_id,
            school_id=school_id,
            instance_id=instance_id,
            group_id=gid,
            position=position,
            cells=cells,
        )
        return map_row(doc)

    async def _assert_row_creation_allowed(
        self,
        *,
        org_id: str,
        school_id: str,
        instance_id: str,
    ) -> None:
        linked = await self._school.find_workspace_item_by_leave_requests_instance_id(
            org_id=org_id,
            school_id=school_id,
            instance_id=instance_id,
        )
        if linked is not None:
            raise ValidationError(
                "Leave request rows can only be created by students submitting the form.",
                code="leave_requests_student_submit_only",
            )

    async def submit_class_leave_request(
        self,
        *,
        org_id: str,
        school_id: str,
        class_workspace_item_id: str,
        user_id: str,
        payload: LeaveRequestSubmitInput,
    ) -> ManagementTableRowPublic:
        item = await self._school.find_school_workspace_item(
            org_id=org_id,
            school_id=school_id,
            item_id=class_workspace_item_id,
        )
        if item is None:
            raise NotFoundError("Workspace item not found.", code="workspace_item_not_found")
        if str(item.get("type", "")) != "class":
            raise ValidationError(
                "Leave requests are only available on class workspace items.",
                code="leave_requests_class_required",
            )
        meta = item.get("metadata")
        meta_dict = dict(meta) if isinstance(meta, dict) else {}
        instance_id = str(meta_dict.get("leaveRequestsTableInstanceId") or "").strip()
        student_col_id = str(meta_dict.get("leaveRequestsTableStudentColumnId") or "").strip()
        status_col_id = str(meta_dict.get("leaveRequestsTableStatusColumnId") or "").strip()
        if not instance_id:
            raise ValidationError(
                "Leave requests table is not set up for this class.",
                code="leave_requests_table_not_bootstrapped",
            )

        is_student = await self._school.user_is_class_student_for_leave(
            org_id=org_id,
            school_id=school_id,
            class_workspace_item_id=class_workspace_item_id,
            user_id=user_id,
        )
        if not is_student:
            raise PermissionDeniedError(
                "Only enrolled class students can submit leave requests.",
                code="leave_requests_student_only",
            )

        user_doc = await self._school.find_user_profile(user_id=user_id)
        if user_doc is None:
            raise NotFoundError("User not found.", code="user_not_found")

        bundle = await self.get_instance_bundle(org_id=org_id, school_id=school_id, instance_id=instance_id)
        gid = MANAGEMENT_TABLE_DEFAULT_GROUP_ID
        col_by_id = {c.id: c for c in bundle.definition.columns}
        reserved_ids = {student_col_id, status_col_id}

        cells: dict[str, Any] = {}
        for col in bundle.definition.columns:
            title = col.title.strip().lower()
            if col.id == student_col_id or title == "student":
                cells[col.id] = {
                    "userId": user_id,
                    "fullName": user_doc.get("full_name"),
                    "username": user_doc.get("username"),
                    "email": user_doc.get("email"),
                }
            elif col.id == status_col_id or title == "status":
                cells[col.id] = "pending"
            elif col.id in payload.cells:
                if col.id in reserved_ids:
                    continue
                cells[col.id] = payload.cells[col.id]
            elif col.type == "checkbox":
                cells[col.id] = False
            elif col.type == "number":
                cells[col.id] = None
            else:
                cells[col.id] = ""

        for col_id in payload.cells:
            if col_id in reserved_ids or col_id not in col_by_id:
                raise ValidationError(
                    f"Invalid or reserved column: {col_id}",
                    code="leave_requests_invalid_column",
                )

        max_pos = await self._mt.max_row_position(
            org_id=org_id,
            school_id=school_id,
            instance_id=instance_id,
            group_id=gid,
        )
        position = (max_pos + 1) if max_pos is not None else 0
        doc = await self._mt.insert_row(
            org_id=org_id,
            school_id=school_id,
            instance_id=instance_id,
            group_id=gid,
            position=position,
            cells=cells,
        )
        return map_row(doc)

    async def create_table_group(
        self,
        *,
        org_id: str,
        school_id: str,
        instance_id: str,
        payload: ManagementTableTableGroupCreateInput,
    ) -> ManagementTableGroupPublic:
        await self.get_instance_bundle(org_id=org_id, school_id=school_id, instance_id=instance_id)
        created = await self._mt.append_table_group(
            org_id=org_id,
            school_id=school_id,
            instance_id=instance_id,
            title=payload.title,
        )
        if created is None:
            raise NotFoundError("Table instance not found.", code="management_table_instance_not_found")
        return ManagementTableGroupPublic(
            id=str(created["id"]),
            title=str(created.get("title", "")),
            order=int(created.get("order", 0)),
        )

    async def patch_row(
        self,
        *,
        org_id: str,
        school_id: str,
        instance_id: str,
        row_id: str,
        payload: ManagementTableRowCellsPatchInput,
    ) -> ManagementTableRowPublic:
        bundle = await self.get_instance_bundle(org_id=org_id, school_id=school_id, instance_id=instance_id)
        allowed = {c.id for c in bundle.definition.columns}
        row = await self._mt.find_row(
            org_id=org_id,
            school_id=school_id,
            instance_id=instance_id,
            row_id=row_id,
        )
        if row is None:
            raise NotFoundError("Row not found.", code="management_table_row_not_found")
        existing_cells = dict(row["cells"]) if isinstance(row.get("cells"), dict) else {}
        for key, val in payload.cells.items():
            if key in allowed:
                existing_cells[key] = val
        ok = await self._mt.update_row_cells(
            org_id=org_id,
            school_id=school_id,
            instance_id=instance_id,
            row_id=row_id,
            cells=existing_cells,
        )
        if not ok:
            raise NotFoundError("Row not found.", code="management_table_row_not_found")
        refreshed = await self._mt.find_row(
            org_id=org_id,
            school_id=school_id,
            instance_id=instance_id,
            row_id=row_id,
        )
        assert refreshed is not None
        await self._maybe_sync_school_student_membership_from_row(
            org_id=org_id,
            school_id=school_id,
            instance_id=instance_id,
            cells=existing_cells,
        )
        await self._maybe_sync_school_parent_membership_from_row(
            org_id=org_id,
            school_id=school_id,
            instance_id=instance_id,
            cells=existing_cells,
        )
        await self._maybe_sync_school_teacher_membership_from_row(
            org_id=org_id,
            school_id=school_id,
            instance_id=instance_id,
            cells=existing_cells,
        )
        await self._maybe_sync_ghost_assignees_from_row(
            org_id=org_id,
            school_id=school_id,
            instance_id=instance_id,
            row=refreshed,
            cells=existing_cells,
        )
        return map_row(refreshed)

    async def delete_row(
        self,
        *,
        org_id: str,
        school_id: str,
        instance_id: str,
        row_id: str,
    ) -> None:
        row = await self._mt.find_row(
            org_id=org_id,
            school_id=school_id,
            instance_id=instance_id,
            row_id=row_id,
        )
        if row is None:
            raise NotFoundError("Row not found.", code="management_table_row_not_found")
        group_id = str(row.get("group_id") or MANAGEMENT_TABLE_DEFAULT_GROUP_ID).strip() or MANAGEMENT_TABLE_DEFAULT_GROUP_ID
        items, _total = await self._mt.list_rows(
            org_id=org_id,
            school_id=school_id,
            instance_id=instance_id,
            group_id=group_id,
            skip=0,
            limit=5000,
        )
        children_by_parent: dict[str, list[str]] = {}
        for item in items:
            parent = str(item.get("parent_row_id") or "").strip()
            if not parent:
                continue
            children_by_parent.setdefault(parent, []).append(str(item["_id"]))

        to_delete: list[str] = []
        stack = [row_id]
        seen: set[str] = set()
        while stack:
            current = stack.pop()
            if current in seen:
                continue
            seen.add(current)
            to_delete.append(current)
            stack.extend(children_by_parent.get(current, []))

        deleted = await self._mt.delete_rows_by_ids(
            org_id=org_id,
            school_id=school_id,
            instance_id=instance_id,
            row_ids=to_delete,
        )
        if deleted < 1:
            raise NotFoundError("Row not found.", code="management_table_row_not_found")

    async def move_row(
        self,
        *,
        org_id: str,
        school_id: str,
        instance_id: str,
        row_id: str,
        payload: ManagementTableRowMoveInput,
    ) -> ManagementTableRowPublic:
        row = await self._mt.find_row(
            org_id=org_id,
            school_id=school_id,
            instance_id=instance_id,
            row_id=row_id,
        )
        if row is None:
            raise NotFoundError("Row not found.", code="management_table_row_not_found")
        group_id = str(row.get("group_id") or MANAGEMENT_TABLE_DEFAULT_GROUP_ID).strip() or MANAGEMENT_TABLE_DEFAULT_GROUP_ID
        parent_raw = row.get("parent_row_id")
        parent_row_id = str(parent_raw).strip() if parent_raw else None
        siblings = await self._mt.list_sibling_rows(
            org_id=org_id,
            school_id=school_id,
            instance_id=instance_id,
            group_id=group_id,
            parent_row_id=parent_row_id,
        )
        index = next((i for i, s in enumerate(siblings) if str(s["_id"]) == row_id), -1)
        if index < 0:
            raise NotFoundError("Row not found.", code="management_table_row_not_found")
        if payload.direction == "up":
            swap_index = index - 1
        else:
            swap_index = index + 1
        if swap_index < 0 or swap_index >= len(siblings):
            raise ValidationError(
                "Row is already at the edge of its sibling list.",
                code="management_table_row_move_edge",
            )
        other = siblings[swap_index]
        other_id = str(other["_id"])
        my_pos = int(row.get("position", index))
        other_pos = int(other.get("position", swap_index))
        if my_pos == other_pos:
            # Positions can collide (e.g. ghost sync inserts); fall back to index order.
            await self._mt.update_row_position(
                org_id=org_id,
                school_id=school_id,
                instance_id=instance_id,
                row_id=row_id,
                position=swap_index,
            )
            await self._mt.update_row_position(
                org_id=org_id,
                school_id=school_id,
                instance_id=instance_id,
                row_id=other_id,
                position=index,
            )
        else:
            await self._mt.update_row_position(
                org_id=org_id,
                school_id=school_id,
                instance_id=instance_id,
                row_id=row_id,
                position=other_pos,
            )
            await self._mt.update_row_position(
                org_id=org_id,
                school_id=school_id,
                instance_id=instance_id,
                row_id=other_id,
                position=my_pos,
            )
        refreshed = await self._mt.find_row(
            org_id=org_id,
            school_id=school_id,
            instance_id=instance_id,
            row_id=row_id,
        )
        assert refreshed is not None
        return map_row(refreshed)

    async def _maybe_sync_school_student_membership_from_row(
        self,
        *,
        org_id: str,
        school_id: str,
        instance_id: str,
        cells: dict[str, Any],
    ) -> None:
        inst = await self._mt.find_instance(
            org_id=org_id,
            school_id=school_id,
            instance_id=instance_id,
        )
        if inst is None:
            return
        ws_id = inst.get("workspace_item_id")
        if not isinstance(ws_id, str) or not ws_id.strip():
            return
        item = await self._school.find_school_workspace_item(
            org_id=org_id,
            school_id=school_id,
            item_id=ws_id.strip(),
        )
        if item is None or str(item.get("type", "")) != "student":
            return
        meta = item.get("metadata")
        meta_dict = dict(meta) if isinstance(meta, dict) else {}
        student_col_id = meta_dict.get("studentsTableStudentColumnId")
        if not isinstance(student_col_id, str) or not student_col_id.strip():
            return
        raw = cells.get(student_col_id.strip())
        if not isinstance(raw, dict):
            return
        user_id = str(raw.get("userId") or raw.get("user_id") or "").strip()
        if not user_id:
            return
        membership = await self._school.find_school_membership(
            user_id=user_id,
            school_id=school_id,
        )
        role_keys = list(membership.get("role_keys", [])) if membership is not None else []
        if "student" not in role_keys:
            role_keys.append("student")
        await self._school.upsert_school_membership(
            user_id=user_id,
            school_id=school_id,
            org_id=org_id,
            role_keys=role_keys,
        )

    async def _maybe_sync_school_parent_membership_from_row(
        self,
        *,
        org_id: str,
        school_id: str,
        instance_id: str,
        cells: dict[str, Any],
    ) -> None:
        inst = await self._mt.find_instance(
            org_id=org_id,
            school_id=school_id,
            instance_id=instance_id,
        )
        if inst is None:
            return
        ws_id = inst.get("workspace_item_id")
        if not isinstance(ws_id, str) or not ws_id.strip():
            return
        item = await self._school.find_school_workspace_item(
            org_id=org_id,
            school_id=school_id,
            item_id=ws_id.strip(),
        )
        if item is None or str(item.get("type", "")) != "parent":
            return
        meta = item.get("metadata")
        meta_dict = dict(meta) if isinstance(meta, dict) else {}
        parent_col_id = meta_dict.get("parentsTableParentColumnId")
        if not isinstance(parent_col_id, str) or not parent_col_id.strip():
            return
        raw = cells.get(parent_col_id.strip())
        if not isinstance(raw, dict):
            return
        user_id = str(raw.get("userId") or raw.get("user_id") or "").strip()
        if not user_id:
            return
        membership = await self._school.find_school_membership(
            user_id=user_id,
            school_id=school_id,
        )
        role_keys = list(membership.get("role_keys", [])) if membership is not None else []
        if "parent" not in role_keys:
            role_keys.append("parent")
        await self._school.upsert_school_membership(
            user_id=user_id,
            school_id=school_id,
            org_id=org_id,
            role_keys=role_keys,
        )

    async def _maybe_sync_school_teacher_membership_from_row(
        self,
        *,
        org_id: str,
        school_id: str,
        instance_id: str,
        cells: dict[str, Any],
    ) -> None:
        inst = await self._mt.find_instance(
            org_id=org_id,
            school_id=school_id,
            instance_id=instance_id,
        )
        if inst is None:
            return
        ws_id = inst.get("workspace_item_id")
        if not isinstance(ws_id, str) or not ws_id.strip():
            return
        item = await self._school.find_school_workspace_item(
            org_id=org_id,
            school_id=school_id,
            item_id=ws_id.strip(),
        )
        if item is None or str(item.get("type", "")) != "staff":
            return
        meta = item.get("metadata")
        meta_dict = dict(meta) if isinstance(meta, dict) else {}
        teacher_col_id = meta_dict.get("teachersTableTeacherColumnId")
        if not isinstance(teacher_col_id, str) or not teacher_col_id.strip():
            return
        raw = cells.get(teacher_col_id.strip())
        if not isinstance(raw, dict):
            return
        user_id = str(raw.get("userId") or raw.get("user_id") or "").strip()
        if not user_id:
            return
        membership = await self._school.find_school_membership(
            user_id=user_id,
            school_id=school_id,
        )
        role_keys = list(membership.get("role_keys", [])) if membership is not None else []
        if "teacher" not in role_keys:
            role_keys.append("teacher")
        await self._school.upsert_school_membership(
            user_id=user_id,
            school_id=school_id,
            org_id=org_id,
            role_keys=role_keys,
        )

    @staticmethod
    def _person_user_ids_from_cell(raw: Any) -> list[str]:
        """Parse single-person or Monday-style `{ people: [...] }` cell values."""
        ids: list[str] = []
        seen: set[str] = set()

        def _add(obj: Mapping[str, Any]) -> None:
            uid = str(obj.get("userId") or obj.get("user_id") or "").strip()
            if not uid or uid in seen:
                return
            seen.add(uid)
            ids.append(uid)

        if raw is None or raw == "":
            return []
        if isinstance(raw, list):
            for item in raw:
                if isinstance(item, Mapping):
                    _add(item)
            return ids
        if isinstance(raw, Mapping):
            people = raw.get("people")
            if isinstance(people, list):
                for item in people:
                    if isinstance(item, Mapping):
                        _add(item)
                return ids
            _add(raw)
        return ids

    async def _maybe_sync_ghost_assignees_from_row(
        self,
        *,
        org_id: str,
        school_id: str,
        instance_id: str,
        row: Mapping[str, Any],
        cells: dict[str, Any],
    ) -> None:
        """Write Ghost Ops Assignee cell (multi-person) back to node.assignee_user_ids."""
        _ = row  # reserved for future open-key fallbacks from row metadata
        inst = await self._mt.find_instance(
            org_id=org_id,
            school_id=school_id,
            instance_id=instance_id,
        )
        if inst is None or not _instance_matches_table_kind(inst, MANAGEMENT_TABLE_KIND_GHOSTS):
            return
        ws_id = inst.get("workspace_item_id")
        if not isinstance(ws_id, str) or not ws_id.strip():
            return
        item = await self._school.find_school_workspace_item(
            org_id=org_id,
            school_id=school_id,
            item_id=ws_id.strip(),
        )
        if item is None:
            return
        meta = item.get("metadata")
        meta_dict = dict(meta) if isinstance(meta, dict) else {}
        col_assignee = meta_dict.get("ghostOpsColAssigneeId")
        col_open = meta_dict.get("ghostOpsColOpenId")
        if not isinstance(col_assignee, str) or not col_assignee.strip():
            return
        if not isinstance(col_open, str) or not col_open.strip():
            return
        open_key = str(cells.get(col_open.strip()) or "").strip()
        if not open_key.startswith("ghost:"):
            return

        # ghost:{id} → end/default node; ghost:{id}:variant:{vid} → that variant
        rest = open_key[len("ghost:") :]
        ghost_id = ""
        variant_id = ""
        if ":variant:" in rest:
            ghost_id, variant_id = rest.split(":variant:", 1)
            ghost_id = ghost_id.strip()
            variant_id = variant_id.strip()
        else:
            ghost_id = rest.strip()

        if not ghost_id:
            return

        from app.domain.ghost_resources.repository import GhostResourcesRepository

        ghost_repo = GhostResourcesRepository(self._school._db)
        doc = await ghost_repo.find_instance(org_id=org_id, school_id=school_id, ghost_id=ghost_id)
        if doc is None:
            return
        if not variant_id:
            variant_id = str(doc.get("default_variant_id") or "").strip()
            if not variant_id:
                nodes = await ghost_repo.list_variants(ghost_id=ghost_id)
                end = next((n for n in nodes if bool(n.get("is_default"))), None)
                if end is None and nodes:
                    end = nodes[0]
                if end is None:
                    return
                variant_id = str(end["_id"])
        node = await ghost_repo.find_variant(ghost_id=ghost_id, variant_id=variant_id)
        if node is None:
            return

        assignee_ids = self._person_user_ids_from_cell(cells.get(col_assignee.strip()))
        existing_ids = [str(x).strip() for x in (node.get("assignee_user_ids") or []) if str(x).strip()]
        if assignee_ids == existing_ids:
            return
        await ghost_repo.update_variant(
            ghost_id=ghost_id,
            variant_id=variant_id,
            patch={"assignee_user_ids": assignee_ids},
        )

    async def bootstrap_workspace_item(
        self,
        *,
        org_id: str,
        school_id: str,
        user_id: str,
        workspace_item_id: str,
    ) -> ManagementTableWorkspaceBootstrapResponse:
        await self._require_school(org_id=org_id, school_id=school_id)
        item = await self._school.find_school_workspace_item(
            org_id=org_id,
            school_id=school_id,
            item_id=workspace_item_id,
        )
        if item is None:
            raise NotFoundError("Workspace item not found.", code="workspace_item_not_found")
        if str(item.get("type", "")) != "management-table":
            raise ValidationError(
                "Workspace item is not a management table.",
                code="management_table_workspace_type_invalid",
            )
        meta = item.get("metadata")
        meta_dict = dict(meta) if isinstance(meta, dict) else {}
        existing_id = meta_dict.get("managementTableInstanceId")
        if isinstance(existing_id, str) and existing_id.strip():
            bundle = await self._load_bootstrap_bundle_if_valid(
                org_id=org_id,
                school_id=school_id,
                instance_id=existing_id,
                table_kind=MANAGEMENT_TABLE_KIND_MANAGEMENT,
            )
            if bundle is not None:
                return ManagementTableWorkspaceBootstrapResponse(
                    instance=bundle.instance,
                    definition=bundle.definition,
                    already_linked=True,
                )
        title = str(item.get("title", "Management table"))
        created = await self.create_definition(
            org_id=org_id,
            school_id=school_id,
            user_id=user_id,
            payload=ManagementTableDefinitionCreateInput(title=title, visibility="self_owned"),
        )
        bundle = await self.create_instance(
            org_id=org_id,
            school_id=school_id,
            payload=ManagementTableInstanceCreateInput(
                definition_id=created.id,
                title=title,
                workspace_item_id=workspace_item_id,
                table_kind=MANAGEMENT_TABLE_KIND_MANAGEMENT,
            ),
        )
        meta_dict["managementTableInstanceId"] = bundle.instance.id
        meta_dict["managementTableDefinitionId"] = bundle.definition.id
        await self._school.update_school_workspace_item(
            org_id=org_id,
            school_id=school_id,
            item_id=workspace_item_id,
            updates={"metadata": meta_dict},
        )
        return ManagementTableWorkspaceBootstrapResponse(
            instance=bundle.instance,
            definition=bundle.definition,
            already_linked=False,
        )

    async def bootstrap_students_table_workspace_item(
        self,
        *,
        org_id: str,
        school_id: str,
        user_id: str,
        workspace_item_id: str,
        allowed_types: frozenset[str],
        invalid_type_code: str,
    ) -> ManagementTableWorkspaceBootstrapResponse:
        await self._require_school(org_id=org_id, school_id=school_id)
        item = await self._school.find_school_workspace_item(
            org_id=org_id,
            school_id=school_id,
            item_id=workspace_item_id,
        )
        if item is None:
            raise NotFoundError("Workspace item not found.", code="workspace_item_not_found")
        item_type = str(item.get("type", ""))
        if item_type not in allowed_types:
            raise ValidationError(
                "Workspace item cannot host a students table.",
                code=invalid_type_code,
            )
        meta = item.get("metadata")
        meta_dict = dict(meta) if isinstance(meta, dict) else {}
        existing_id = meta_dict.get("studentsTableInstanceId")
        if isinstance(existing_id, str) and existing_id.strip():
            bundle = await self._load_bootstrap_bundle_if_valid(
                org_id=org_id,
                school_id=school_id,
                instance_id=existing_id,
                table_kind=MANAGEMENT_TABLE_KIND_STUDENTS,
            )
            if bundle is not None:
                return ManagementTableWorkspaceBootstrapResponse(
                    instance=bundle.instance,
                    definition=bundle.definition,
                    already_linked=True,
                )
        item_title = str(item.get("title", "Students")).strip() or "Students"
        student_col_id = _new_column_id()
        starter_columns = [
            {
                "id": student_col_id,
                "title": "Student",
                "type": "text",
                "order": 0,
                "settings": {"cellEditor": "person"},
            },
        ]
        definition_doc = await self._mt.insert_definition(
            org_id=org_id,
            school_id=school_id,
            title=f"{item_title} — Students",
            visibility="self_owned",
            created_by_user_id=user_id,
            columns=starter_columns,
        )
        bundle = await self.create_instance(
            org_id=org_id,
            school_id=school_id,
            payload=ManagementTableInstanceCreateInput(
                definition_id=str(definition_doc["_id"]),
                title=f"{item_title} Students",
                workspace_item_id=workspace_item_id,
                table_kind=MANAGEMENT_TABLE_KIND_STUDENTS,
            ),
        )
        meta_dict["studentsTableInstanceId"] = bundle.instance.id
        meta_dict["studentsTableDefinitionId"] = bundle.definition.id
        meta_dict["studentsTableStudentColumnId"] = student_col_id
        await self._school.update_school_workspace_item(
            org_id=org_id,
            school_id=school_id,
            item_id=workspace_item_id,
            updates={"metadata": meta_dict},
        )
        return ManagementTableWorkspaceBootstrapResponse(
            instance=bundle.instance,
            definition=bundle.definition,
            already_linked=False,
        )

    async def bootstrap_class_students_table(
        self,
        *,
        org_id: str,
        school_id: str,
        user_id: str,
        class_workspace_item_id: str,
    ) -> ManagementTableWorkspaceBootstrapResponse:
        return await self.bootstrap_students_table_workspace_item(
            org_id=org_id,
            school_id=school_id,
            user_id=user_id,
            workspace_item_id=class_workspace_item_id,
            allowed_types=frozenset({"class"}),
            invalid_type_code="class_students_table_workspace_type_invalid",
        )

    async def bootstrap_school_students_table(
        self,
        *,
        org_id: str,
        school_id: str,
        user_id: str,
        student_workspace_item_id: str,
    ) -> ManagementTableWorkspaceBootstrapResponse:
        return await self.bootstrap_students_table_workspace_item(
            org_id=org_id,
            school_id=school_id,
            user_id=user_id,
            workspace_item_id=student_workspace_item_id,
            allowed_types=frozenset({"student"}),
            invalid_type_code="school_students_table_workspace_type_invalid",
        )

    async def bootstrap_parents_table_workspace_item(
        self,
        *,
        org_id: str,
        school_id: str,
        user_id: str,
        workspace_item_id: str,
        allowed_types: frozenset[str],
        invalid_type_code: str,
    ) -> ManagementTableWorkspaceBootstrapResponse:
        await self._require_school(org_id=org_id, school_id=school_id)
        item = await self._school.find_school_workspace_item(
            org_id=org_id,
            school_id=school_id,
            item_id=workspace_item_id,
        )
        if item is None:
            raise NotFoundError("Workspace item not found.", code="workspace_item_not_found")
        item_type = str(item.get("type", ""))
        if item_type not in allowed_types:
            raise ValidationError(
                "Workspace item cannot host a parents table.",
                code=invalid_type_code,
            )
        meta = item.get("metadata")
        meta_dict = dict(meta) if isinstance(meta, dict) else {}
        students_instance_id = str(meta_dict.get("studentsTableInstanceId") or "").strip()
        existing_id_raw = meta_dict.get("parentsTableInstanceId")
        existing_id = existing_id_raw.strip() if isinstance(existing_id_raw, str) else ""
        if existing_id and existing_id == students_instance_id:
            existing_id = ""
        if existing_id:
            bundle = await self._load_bootstrap_bundle_if_valid(
                org_id=org_id,
                school_id=school_id,
                instance_id=existing_id,
                table_kind=MANAGEMENT_TABLE_KIND_PARENTS,
            )
            if bundle is not None:
                parent_col_id = meta_dict.get("parentsTableParentColumnId")
                has_parent_col = any(
                    c.title.strip().lower() == "parent"
                    or (isinstance(parent_col_id, str) and c.id == parent_col_id.strip())
                    for c in bundle.definition.columns
                )
                if has_parent_col:
                    return ManagementTableWorkspaceBootstrapResponse(
                        instance=bundle.instance,
                        definition=bundle.definition,
                        already_linked=True,
                    )
        item_title = str(item.get("title", "Parents")).strip() or "Parents"
        parent_col_id = _new_column_id()
        starter_columns: list[dict[str, Any]] = [
            {
                "id": parent_col_id,
                "title": "Parent",
                "type": "text",
                "order": 0,
                "settings": {"cellEditor": "person"},
            },
        ]
        student_col_id: str | None = None
        if item_type == "class":
            student_col_id = _new_column_id()
            starter_columns.append(
                {
                    "id": student_col_id,
                    "title": "Student",
                    "type": "text",
                    "order": 1,
                    "settings": {"cellEditor": "person"},
                },
            )
        definition_doc = await self._mt.insert_definition(
            org_id=org_id,
            school_id=school_id,
            title=f"{item_title} — Parents",
            visibility="self_owned",
            created_by_user_id=user_id,
            columns=starter_columns,
        )
        bundle = await self.create_instance(
            org_id=org_id,
            school_id=school_id,
            payload=ManagementTableInstanceCreateInput(
                definition_id=str(definition_doc["_id"]),
                title=f"{item_title} Parents",
                workspace_item_id=workspace_item_id,
                table_kind=MANAGEMENT_TABLE_KIND_PARENTS,
            ),
        )
        meta_dict["parentsTableInstanceId"] = bundle.instance.id
        meta_dict["parentsTableDefinitionId"] = bundle.definition.id
        meta_dict["parentsTableParentColumnId"] = parent_col_id
        if student_col_id is not None:
            meta_dict["parentsTableStudentColumnId"] = student_col_id
        await self._school.update_school_workspace_item(
            org_id=org_id,
            school_id=school_id,
            item_id=workspace_item_id,
            updates={"metadata": meta_dict},
        )
        return ManagementTableWorkspaceBootstrapResponse(
            instance=bundle.instance,
            definition=bundle.definition,
            already_linked=False,
        )

    async def bootstrap_leave_requests_table_workspace_item(
        self,
        *,
        org_id: str,
        school_id: str,
        user_id: str,
        workspace_item_id: str,
        allowed_types: frozenset[str],
        invalid_type_code: str,
    ) -> ManagementTableWorkspaceBootstrapResponse:
        await self._require_school(org_id=org_id, school_id=school_id)
        item = await self._school.find_school_workspace_item(
            org_id=org_id,
            school_id=school_id,
            item_id=workspace_item_id,
        )
        if item is None:
            raise NotFoundError("Workspace item not found.", code="workspace_item_not_found")
        item_type = str(item.get("type", ""))
        if item_type not in allowed_types:
            raise ValidationError(
                "Workspace item cannot host a leave requests table.",
                code=invalid_type_code,
            )
        meta = item.get("metadata")
        meta_dict = dict(meta) if isinstance(meta, dict) else {}
        existing_id_raw = meta_dict.get("leaveRequestsTableInstanceId")
        existing_id = existing_id_raw.strip() if isinstance(existing_id_raw, str) else ""
        if existing_id:
            bundle = await self._load_bootstrap_bundle_if_valid(
                org_id=org_id,
                school_id=school_id,
                instance_id=existing_id,
                table_kind=MANAGEMENT_TABLE_KIND_LEAVE_REQUESTS,
            )
            if bundle is not None:
                return ManagementTableWorkspaceBootstrapResponse(
                    instance=bundle.instance,
                    definition=bundle.definition,
                    already_linked=True,
                )
        item_title = str(item.get("title", "Class")).strip() or "Class"
        student_col_id = _new_column_id()
        status_col_id = _new_column_id()
        starter_columns: list[dict[str, Any]] = [
            {
                "id": student_col_id,
                "title": "Student",
                "type": "text",
                "order": 0,
                "settings": {"cellEditor": "person"},
            },
            {
                "id": _new_column_id(),
                "title": "Start date",
                "type": "date",
                "order": 1,
                "settings": {},
            },
            {
                "id": _new_column_id(),
                "title": "End date",
                "type": "date",
                "order": 2,
                "settings": {},
            },
            {
                "id": _new_column_id(),
                "title": "Reason",
                "type": "textarea",
                "order": 3,
                "settings": {},
            },
            {
                "id": _new_column_id(),
                "title": "Document",
                "type": "link",
                "order": 4,
                "settings": {},
            },
            {
                "id": status_col_id,
                "title": "Status",
                "type": "status",
                "order": 5,
                "settings": {
                    "options": [
                        {"id": "pending", "label": "Pending"},
                        {"id": "approved", "label": "Approved"},
                        {"id": "rejected", "label": "Rejected"},
                    ],
                },
            },
        ]
        definition_doc = await self._mt.insert_definition(
            org_id=org_id,
            school_id=school_id,
            title=f"{item_title} — Leave requests",
            visibility="self_owned",
            created_by_user_id=user_id,
            columns=starter_columns,
        )
        bundle = await self.create_instance(
            org_id=org_id,
            school_id=school_id,
            payload=ManagementTableInstanceCreateInput(
                definition_id=str(definition_doc["_id"]),
                title=f"{item_title} Leave requests",
                workspace_item_id=workspace_item_id,
                table_kind=MANAGEMENT_TABLE_KIND_LEAVE_REQUESTS,
            ),
        )
        meta_dict["leaveRequestsTableInstanceId"] = bundle.instance.id
        meta_dict["leaveRequestsTableDefinitionId"] = bundle.definition.id
        meta_dict["leaveRequestsTableStudentColumnId"] = student_col_id
        meta_dict["leaveRequestsTableStatusColumnId"] = status_col_id
        await self._school.update_school_workspace_item(
            org_id=org_id,
            school_id=school_id,
            item_id=workspace_item_id,
            updates={"metadata": meta_dict},
        )
        return ManagementTableWorkspaceBootstrapResponse(
            instance=bundle.instance,
            definition=bundle.definition,
            already_linked=False,
        )

    async def bootstrap_class_leave_requests_table(
        self,
        *,
        org_id: str,
        school_id: str,
        user_id: str,
        class_workspace_item_id: str,
    ) -> ManagementTableWorkspaceBootstrapResponse:
        return await self.bootstrap_leave_requests_table_workspace_item(
            org_id=org_id,
            school_id=school_id,
            user_id=user_id,
            workspace_item_id=class_workspace_item_id,
            allowed_types=frozenset({"class"}),
            invalid_type_code="class_leave_requests_table_workspace_type_invalid",
        )

    async def bootstrap_class_parents_table(
        self,
        *,
        org_id: str,
        school_id: str,
        user_id: str,
        class_workspace_item_id: str,
    ) -> ManagementTableWorkspaceBootstrapResponse:
        return await self.bootstrap_parents_table_workspace_item(
            org_id=org_id,
            school_id=school_id,
            user_id=user_id,
            workspace_item_id=class_workspace_item_id,
            allowed_types=frozenset({"class"}),
            invalid_type_code="class_parents_table_workspace_type_invalid",
        )

    async def bootstrap_school_parents_table(
        self,
        *,
        org_id: str,
        school_id: str,
        user_id: str,
        parent_workspace_item_id: str,
    ) -> ManagementTableWorkspaceBootstrapResponse:
        return await self.bootstrap_parents_table_workspace_item(
            org_id=org_id,
            school_id=school_id,
            user_id=user_id,
            workspace_item_id=parent_workspace_item_id,
            allowed_types=frozenset({"parent"}),
            invalid_type_code="school_parents_table_workspace_type_invalid",
        )

    async def bootstrap_teachers_table_workspace_item(
        self,
        *,
        org_id: str,
        school_id: str,
        user_id: str,
        workspace_item_id: str,
        allowed_types: frozenset[str],
        invalid_type_code: str,
        include_role_subject_columns: bool = True,
    ) -> ManagementTableWorkspaceBootstrapResponse:
        await self._require_school(org_id=org_id, school_id=school_id)
        item = await self._school.find_school_workspace_item(
            org_id=org_id,
            school_id=school_id,
            item_id=workspace_item_id,
        )
        if item is None:
            raise NotFoundError("Workspace item not found.", code="workspace_item_not_found")
        item_type = str(item.get("type", ""))
        if item_type not in allowed_types:
            raise ValidationError(
                "Workspace item cannot host a teachers table.",
                code=invalid_type_code,
            )
        meta = item.get("metadata")
        meta_dict = dict(meta) if isinstance(meta, dict) else {}
        existing_id_raw = meta_dict.get("teachersTableInstanceId")
        existing_id = existing_id_raw.strip() if isinstance(existing_id_raw, str) else ""
        if existing_id:
            bundle = await self._load_bootstrap_bundle_if_valid(
                org_id=org_id,
                school_id=school_id,
                instance_id=existing_id,
                table_kind=MANAGEMENT_TABLE_KIND_TEACHERS,
            )
            if bundle is not None:
                return ManagementTableWorkspaceBootstrapResponse(
                    instance=bundle.instance,
                    definition=bundle.definition,
                    already_linked=True,
                )
        item_title = str(item.get("title", "Class")).strip() or "Class"
        if "staff" in allowed_types:
            item_title = str(item.get("title", "Teachers")).strip() or "Teachers"
        teacher_col_id = _new_column_id()
        starter_columns: list[dict[str, Any]] = [
            {
                "id": teacher_col_id,
                "title": "Teacher",
                "type": "text",
                "order": 0,
                "settings": {"cellEditor": "person"},
            },
        ]
        if include_role_subject_columns:
            starter_columns.extend(
                [
                    {
                        "id": _new_column_id(),
                        "title": "Role",
                        "type": "text",
                        "order": 1,
                        "settings": {},
                    },
                    {
                        "id": _new_column_id(),
                        "title": "Subject",
                        "type": "text",
                        "order": 2,
                        "settings": {},
                    },
                ],
            )
        definition_doc = await self._mt.insert_definition(
            org_id=org_id,
            school_id=school_id,
            title=f"{item_title} — Teachers",
            visibility="self_owned",
            created_by_user_id=user_id,
            columns=starter_columns,
        )
        bundle = await self.create_instance(
            org_id=org_id,
            school_id=school_id,
            payload=ManagementTableInstanceCreateInput(
                definition_id=str(definition_doc["_id"]),
                title=f"{item_title} Teachers",
                workspace_item_id=workspace_item_id,
                table_kind=MANAGEMENT_TABLE_KIND_TEACHERS,
            ),
        )
        meta_dict["teachersTableInstanceId"] = bundle.instance.id
        meta_dict["teachersTableDefinitionId"] = bundle.definition.id
        meta_dict["teachersTableTeacherColumnId"] = teacher_col_id
        await self._school.update_school_workspace_item(
            org_id=org_id,
            school_id=school_id,
            item_id=workspace_item_id,
            updates={"metadata": meta_dict},
        )
        return ManagementTableWorkspaceBootstrapResponse(
            instance=bundle.instance,
            definition=bundle.definition,
            already_linked=False,
        )

    async def bootstrap_class_teachers_table(
        self,
        *,
        org_id: str,
        school_id: str,
        user_id: str,
        class_workspace_item_id: str,
    ) -> ManagementTableWorkspaceBootstrapResponse:
        return await self.bootstrap_teachers_table_workspace_item(
            org_id=org_id,
            school_id=school_id,
            user_id=user_id,
            workspace_item_id=class_workspace_item_id,
            allowed_types=frozenset({"class"}),
            invalid_type_code="class_teachers_table_workspace_type_invalid",
            include_role_subject_columns=True,
        )

    async def bootstrap_school_teachers_table(
        self,
        *,
        org_id: str,
        school_id: str,
        user_id: str,
        staff_workspace_item_id: str,
    ) -> ManagementTableWorkspaceBootstrapResponse:
        return await self.bootstrap_teachers_table_workspace_item(
            org_id=org_id,
            school_id=school_id,
            user_id=user_id,
            workspace_item_id=staff_workspace_item_id,
            allowed_types=frozenset({"staff"}),
            invalid_type_code="school_teachers_table_workspace_type_invalid",
            include_role_subject_columns=False,
        )

    async def bootstrap_grades_table_workspace_item(
        self,
        *,
        org_id: str,
        school_id: str,
        user_id: str,
        workspace_item_id: str,
        allowed_types: frozenset[str],
        invalid_type_code: str,
    ) -> ManagementTableWorkspaceBootstrapResponse:
        await self._require_school(org_id=org_id, school_id=school_id)
        item = await self._school.find_school_workspace_item(
            org_id=org_id,
            school_id=school_id,
            item_id=workspace_item_id,
        )
        if item is None:
            raise NotFoundError("Workspace item not found.", code="workspace_item_not_found")
        item_type = str(item.get("type", ""))
        if item_type not in allowed_types:
            raise ValidationError(
                "Workspace item cannot host a grades table.",
                code=invalid_type_code,
            )
        meta = item.get("metadata")
        meta_dict = dict(meta) if isinstance(meta, dict) else {}
        existing_id_raw = meta_dict.get("gradesTableInstanceId")
        existing_id = existing_id_raw.strip() if isinstance(existing_id_raw, str) else ""
        if existing_id:
            bundle = await self._load_bootstrap_bundle_if_valid(
                org_id=org_id,
                school_id=school_id,
                instance_id=existing_id,
                table_kind=MANAGEMENT_TABLE_KIND_GRADES,
            )
            if bundle is not None:
                return ManagementTableWorkspaceBootstrapResponse(
                    instance=bundle.instance,
                    definition=bundle.definition,
                    already_linked=True,
                )
        item_title = str(item.get("title", "Class")).strip() or "Class"
        student_col_id = _new_column_id()
        teacher_col_id = _new_column_id()
        starter_columns: list[dict[str, Any]] = [
            {
                "id": student_col_id,
                "title": "Student",
                "type": "text",
                "order": 0,
                "settings": {"cellEditor": "person"},
            },
            {
                "id": teacher_col_id,
                "title": "Teacher",
                "type": "text",
                "order": 1,
                "settings": {"cellEditor": "person"},
            },
            {
                "id": _new_column_id(),
                "title": "Course Name",
                "type": "text",
                "order": 2,
                "settings": {},
            },
            {
                "id": _new_column_id(),
                "title": "Quiz",
                "type": "number",
                "order": 3,
                "settings": {},
            },
            {
                "id": _new_column_id(),
                "title": "Mid",
                "type": "number",
                "order": 4,
                "settings": {},
            },
        ]
        definition_doc = await self._mt.insert_definition(
            org_id=org_id,
            school_id=school_id,
            title=f"{item_title} — Grades",
            visibility="self_owned",
            created_by_user_id=user_id,
            columns=starter_columns,
        )
        bundle = await self.create_instance(
            org_id=org_id,
            school_id=school_id,
            payload=ManagementTableInstanceCreateInput(
                definition_id=str(definition_doc["_id"]),
                title=f"{item_title} Grades",
                workspace_item_id=workspace_item_id,
                table_kind=MANAGEMENT_TABLE_KIND_GRADES,
            ),
        )
        meta_dict["gradesTableInstanceId"] = bundle.instance.id
        meta_dict["gradesTableDefinitionId"] = bundle.definition.id
        meta_dict["gradesTableStudentColumnId"] = student_col_id
        meta_dict["gradesTableTeacherColumnId"] = teacher_col_id
        await self._school.update_school_workspace_item(
            org_id=org_id,
            school_id=school_id,
            item_id=workspace_item_id,
            updates={"metadata": meta_dict},
        )
        return ManagementTableWorkspaceBootstrapResponse(
            instance=bundle.instance,
            definition=bundle.definition,
            already_linked=False,
        )

    async def bootstrap_class_grades_table(
        self,
        *,
        org_id: str,
        school_id: str,
        user_id: str,
        class_workspace_item_id: str,
    ) -> ManagementTableWorkspaceBootstrapResponse:
        return await self.bootstrap_grades_table_workspace_item(
            org_id=org_id,
            school_id=school_id,
            user_id=user_id,
            workspace_item_id=class_workspace_item_id,
            allowed_types=frozenset({"class"}),
            invalid_type_code="class_grades_table_workspace_type_invalid",
        )

    async def bootstrap_schedules_table_workspace_item(
        self,
        *,
        org_id: str,
        school_id: str,
        user_id: str,
        workspace_item_id: str,
        allowed_types: frozenset[str],
        invalid_type_code: str,
    ) -> ManagementTableWorkspaceBootstrapResponse:
        await self._require_school(org_id=org_id, school_id=school_id)
        item = await self._school.find_school_workspace_item(
            org_id=org_id,
            school_id=school_id,
            item_id=workspace_item_id,
        )
        if item is None:
            raise NotFoundError("Workspace item not found.", code="workspace_item_not_found")
        item_type = str(item.get("type", ""))
        if item_type not in allowed_types:
            raise ValidationError(
                "Workspace item cannot host a schedules table.",
                code=invalid_type_code,
            )
        meta = item.get("metadata")
        meta_dict = dict(meta) if isinstance(meta, dict) else {}
        existing_id_raw = meta_dict.get("schedulesTableInstanceId")
        existing_id = existing_id_raw.strip() if isinstance(existing_id_raw, str) else ""
        if existing_id:
            bundle = await self._load_bootstrap_bundle_if_valid(
                org_id=org_id,
                school_id=school_id,
                instance_id=existing_id,
                table_kind=MANAGEMENT_TABLE_KIND_SCHEDULES,
            )
            if bundle is not None:
                return ManagementTableWorkspaceBootstrapResponse(
                    instance=bundle.instance,
                    definition=bundle.definition,
                    already_linked=True,
                )
        item_title = str(item.get("title", "Class")).strip() or "Class"
        session_col_id = _new_column_id()
        starter_columns: list[dict[str, Any]] = [
            {
                "id": session_col_id,
                "title": "Session",
                "type": "text",
                "order": 0,
                "settings": {"cellEditor": "class_session"},
            },
        ]
        definition_doc = await self._mt.insert_definition(
            org_id=org_id,
            school_id=school_id,
            title=f"{item_title} — Schedule",
            visibility="self_owned",
            created_by_user_id=user_id,
            columns=starter_columns,
        )
        bundle = await self.create_instance(
            org_id=org_id,
            school_id=school_id,
            payload=ManagementTableInstanceCreateInput(
                definition_id=str(definition_doc["_id"]),
                title=f"{item_title} Schedule",
                workspace_item_id=workspace_item_id,
                table_kind=MANAGEMENT_TABLE_KIND_SCHEDULES,
            ),
        )
        meta_dict["schedulesTableInstanceId"] = bundle.instance.id
        meta_dict["schedulesTableDefinitionId"] = bundle.definition.id
        meta_dict["schedulesTableSessionColumnId"] = session_col_id
        await self._school.update_school_workspace_item(
            org_id=org_id,
            school_id=school_id,
            item_id=workspace_item_id,
            updates={"metadata": meta_dict},
        )
        return ManagementTableWorkspaceBootstrapResponse(
            instance=bundle.instance,
            definition=bundle.definition,
            already_linked=False,
        )

    async def bootstrap_class_schedules_table(
        self,
        *,
        org_id: str,
        school_id: str,
        user_id: str,
        class_workspace_item_id: str,
    ) -> ManagementTableWorkspaceBootstrapResponse:
        return await self.bootstrap_schedules_table_workspace_item(
            org_id=org_id,
            school_id=school_id,
            user_id=user_id,
            workspace_item_id=class_workspace_item_id,
            allowed_types=frozenset({"class"}),
            invalid_type_code="class_schedules_table_workspace_type_invalid",
        )

    async def bootstrap_assignments_table_workspace_item(
        self,
        *,
        org_id: str,
        school_id: str,
        user_id: str,
        workspace_item_id: str,
        allowed_types: frozenset[str],
        invalid_type_code: str,
    ) -> ManagementTableWorkspaceBootstrapResponse:
        await self._require_school(org_id=org_id, school_id=school_id)
        item = await self._school.find_school_workspace_item(
            org_id=org_id,
            school_id=school_id,
            item_id=workspace_item_id,
        )
        if item is None:
            raise NotFoundError("Workspace item not found.", code="workspace_item_not_found")
        item_type = str(item.get("type", ""))
        if item_type not in allowed_types:
            raise ValidationError(
                "Workspace item cannot host an assignments table.",
                code=invalid_type_code,
            )
        meta = item.get("metadata")
        meta_dict = dict(meta) if isinstance(meta, dict) else {}
        existing_id_raw = meta_dict.get("assignmentsTableInstanceId")
        existing_id = existing_id_raw.strip() if isinstance(existing_id_raw, str) else ""
        if existing_id:
            bundle = await self._load_bootstrap_bundle_if_valid(
                org_id=org_id,
                school_id=school_id,
                instance_id=existing_id,
                table_kind=MANAGEMENT_TABLE_KIND_ASSIGNMENTS,
            )
            if bundle is not None:
                return ManagementTableWorkspaceBootstrapResponse(
                    instance=bundle.instance,
                    definition=bundle.definition,
                    already_linked=True,
                )
        item_title = str(item.get("title", "Class")).strip() or "Class"
        assignment_col_id = _new_column_id()
        teacher_col_id = _new_column_id()
        assignment_status_options = [
            {"id": "assigned", "label": "Assigned"},
            {"id": "in_progress", "label": "In Progress"},
            {"id": "submitted", "label": "Submitted"},
            {"id": "graded", "label": "Graded"},
            {"id": "overdue", "label": "Overdue"},
            {"id": "cancelled", "label": "Cancelled"},
        ]
        starter_columns: list[dict[str, Any]] = [
            {
                "id": assignment_col_id,
                "title": "Assignment",
                "type": "text",
                "order": 0,
                "settings": {},
            },
            {
                "id": _new_column_id(),
                "title": "Course",
                "type": "text",
                "order": 1,
                "settings": {},
            },
            {
                "id": teacher_col_id,
                "title": "Teacher",
                "type": "text",
                "order": 2,
                "settings": {"cellEditor": "person"},
            },
            {
                "id": _new_column_id(),
                "title": "Due Date",
                "type": "date",
                "order": 3,
                "settings": {},
            },
            {
                "id": _new_column_id(),
                "title": "Status",
                "type": "status",
                "order": 4,
                "settings": {"options": assignment_status_options},
            },
        ]
        definition_doc = await self._mt.insert_definition(
            org_id=org_id,
            school_id=school_id,
            title=f"{item_title} — Assignments",
            visibility="self_owned",
            created_by_user_id=user_id,
            columns=starter_columns,
        )
        bundle = await self.create_instance(
            org_id=org_id,
            school_id=school_id,
            payload=ManagementTableInstanceCreateInput(
                definition_id=str(definition_doc["_id"]),
                title=f"{item_title} Assignments",
                workspace_item_id=workspace_item_id,
                table_kind=MANAGEMENT_TABLE_KIND_ASSIGNMENTS,
            ),
        )
        meta_dict["assignmentsTableInstanceId"] = bundle.instance.id
        meta_dict["assignmentsTableDefinitionId"] = bundle.definition.id
        meta_dict["assignmentsTableAssignmentColumnId"] = assignment_col_id
        meta_dict["assignmentsTableTeacherColumnId"] = teacher_col_id
        await self._school.update_school_workspace_item(
            org_id=org_id,
            school_id=school_id,
            item_id=workspace_item_id,
            updates={"metadata": meta_dict},
        )
        return ManagementTableWorkspaceBootstrapResponse(
            instance=bundle.instance,
            definition=bundle.definition,
            already_linked=False,
        )

    async def bootstrap_ghost_ops_table_workspace_item(
        self,
        *,
        org_id: str,
        school_id: str,
        user_id: str,
        workspace_item_id: str,
    ) -> ManagementTableWorkspaceBootstrapResponse:
        """Ops board for Ghost Resources (mirror — not Property/Chain editor)."""
        await self._require_school(org_id=org_id, school_id=school_id)
        item = await self._school.find_school_workspace_item(
            org_id=org_id,
            school_id=school_id,
            item_id=workspace_item_id,
        )
        if item is None:
            raise NotFoundError("Workspace item not found.", code="workspace_item_not_found")
        meta = item.get("metadata")
        meta_dict = dict(meta) if isinstance(meta, dict) else {}
        existing_id_raw = meta_dict.get("ghostOpsTableInstanceId")
        existing_id = existing_id_raw.strip() if isinstance(existing_id_raw, str) else ""
        if existing_id:
            bundle = await self._load_bootstrap_bundle_if_valid(
                org_id=org_id,
                school_id=school_id,
                instance_id=existing_id,
                table_kind=MANAGEMENT_TABLE_KIND_GHOSTS,
            )
            if bundle is not None:
                await self._ensure_ghost_ops_extra_columns(
                    org_id=org_id,
                    school_id=school_id,
                    workspace_item_id=workspace_item_id,
                    meta_dict=meta_dict,
                    definition_id=bundle.definition.id,
                )
                return ManagementTableWorkspaceBootstrapResponse(
                    instance=bundle.instance,
                    definition=(
                        await self.get_instance_bundle(
                            org_id=org_id, school_id=school_id, instance_id=bundle.instance.id
                        )
                    ).definition,
                    already_linked=True,
                )

        item_title = str(item.get("title", "Workspace")).strip() or "Workspace"
        col_title = _new_column_id()
        col_kind = _new_column_id()
        col_desc = _new_column_id()
        col_req = _new_column_id()
        col_chain = _new_column_id()
        col_blocked = _new_column_id()
        col_impl = _new_column_id()
        col_assignee = _new_column_id()
        col_status = _new_column_id()
        col_due = _new_column_id()
        col_open = _new_column_id()
        status_options = [
            {"id": "open", "label": "Open"},
            {"id": "in_progress", "label": "Working on"},
            {"id": "stuck", "label": "Stuck"},
            {"id": "submitted", "label": "Request for approval"},
            {"id": "changes_requested", "label": "Changes requested"},
            {"id": "approved", "label": "Approved"},
            {"id": "rejected", "label": "Rejected"},
            {"id": "fulfilled", "label": "Fulfilled"},
            {"id": "cancelled", "label": "Cancelled"},
        ]
        impl_options = [
            {"id": "same_base", "label": "Same Base"},
            {"id": "branch_base", "label": "Branch Base"},
        ]
        kind_options = [
            {"id": "ghost", "label": "Ghost"},
            {"id": "variant", "label": "Variant"},
            {"id": "resource", "label": "Resource"},
        ]
        starter_columns: list[dict[str, Any]] = [
            {"id": col_title, "title": "Item", "type": "text", "order": 0, "settings": {}},
            {
                "id": col_kind,
                "title": "Kind",
                "type": "status",
                "order": 1,
                "settings": {"options": kind_options},
            },
            {"id": col_desc, "title": "Description", "type": "textarea", "order": 2, "settings": {}},
            {"id": col_req, "title": "Requirements", "type": "text", "order": 3, "settings": {}},
            {"id": col_chain, "title": "Chain node", "type": "text", "order": 4, "settings": {}},
            {"id": col_blocked, "title": "Requires", "type": "text", "order": 5, "settings": {}},
            {
                "id": col_impl,
                "title": "Implementation",
                "type": "status",
                "order": 6,
                "settings": {"options": impl_options},
            },
            {
                "id": col_assignee,
                "title": "Assignee",
                "type": "text",
                "order": 7,
                "settings": {"cellEditor": "person", "multiPerson": True},
            },
            {
                "id": col_status,
                "title": "Status",
                "type": "status",
                "order": 8,
                "settings": {"options": status_options},
            },
            {"id": col_due, "title": "Due", "type": "date", "order": 9, "settings": {}},
            {"id": col_open, "title": "Open ghost", "type": "link", "order": 10, "settings": {}},
        ]
        definition_doc = await self._mt.insert_definition(
            org_id=org_id,
            school_id=school_id,
            title=f"{item_title} — Ghost ops",
            visibility="self_owned",
            created_by_user_id=user_id,
            columns=starter_columns,
        )
        bundle = await self.create_instance(
            org_id=org_id,
            school_id=school_id,
            payload=ManagementTableInstanceCreateInput(
                definition_id=str(definition_doc["_id"]),
                title=f"{item_title} Ghost ops",
                workspace_item_id=workspace_item_id,
                table_kind=MANAGEMENT_TABLE_KIND_GHOSTS,
            ),
        )
        meta_dict["ghostOpsTableInstanceId"] = bundle.instance.id
        meta_dict["ghostOpsTableDefinitionId"] = bundle.definition.id
        meta_dict["ghostOpsColTitleId"] = col_title
        meta_dict["ghostOpsColKindId"] = col_kind
        meta_dict["ghostOpsColDescriptionId"] = col_desc
        meta_dict["ghostOpsColRequirementsId"] = col_req
        meta_dict["ghostOpsColChainNodeId"] = col_chain
        meta_dict["ghostOpsColBlockedById"] = col_blocked
        meta_dict["ghostOpsColImplementationId"] = col_impl
        meta_dict["ghostOpsColAssigneeId"] = col_assignee
        meta_dict["ghostOpsColStatusId"] = col_status
        meta_dict["ghostOpsColDueId"] = col_due
        meta_dict["ghostOpsColOpenId"] = col_open
        await self._school.update_school_workspace_item(
            org_id=org_id,
            school_id=school_id,
            item_id=workspace_item_id,
            updates={"metadata": meta_dict},
        )
        return ManagementTableWorkspaceBootstrapResponse(
            instance=bundle.instance,
            definition=bundle.definition,
            already_linked=False,
        )

    async def _ensure_ghost_ops_extra_columns(
        self,
        *,
        org_id: str,
        school_id: str,
        workspace_item_id: str,
        meta_dict: dict[str, Any],
        definition_id: str,
    ) -> None:
        """Migrate older ghost-ops tables to include Property columns + kind."""
        needed = (
            "ghostOpsColKindId",
            "ghostOpsColDescriptionId",
            "ghostOpsColRequirementsId",
        )
        missing_meta = [k for k in needed if not (isinstance(meta_dict.get(k), str) and meta_dict.get(k))]
        doc = await self._mt.find_definition(
            org_id=org_id, school_id=school_id, definition_id=definition_id
        )
        if doc is None:
            return
        raw_cols = doc.get("columns")
        columns: list[dict[str, Any]] = [dict(c) for c in raw_cols] if isinstance(raw_cols, list) else []
        by_title = {
            str(c.get("title") or "").strip().lower(): c for c in columns if isinstance(c, dict)
        }
        changed = False
        meta_changed = False

        # Soft-rename legacy titles when present.
        for col in columns:
            title = str(col.get("title") or "").strip()
            if title == "Ghost title":
                col["title"] = "Item"
                changed = True
            elif title == "Blocked by":
                col["title"] = "Requires"
                changed = True

        kind_options = [
            {"id": "ghost", "label": "Ghost"},
            {"id": "variant", "label": "Variant"},
            {"id": "resource", "label": "Resource"},
        ]

        # Ensure Kind column offers Resource (approved deliverables).
        for col in columns:
            if str(col.get("title") or "").strip().lower() != "kind":
                continue
            settings = dict(col.get("settings") or {})
            opts = list(settings.get("options") or [])
            ids = {
                str(o.get("id"))
                for o in opts
                if isinstance(o, dict) and o.get("id") is not None
            }
            if "resource" not in ids:
                opts.append({"id": "resource", "label": "Resource"})
                settings["options"] = opts
                col["settings"] = settings
                changed = True
            break

        # Assignee: Monday-style multi-person cell.
        for col in columns:
            if str(col.get("title") or "").strip().lower() != "assignee":
                continue
            settings = dict(col.get("settings") or {})
            if settings.get("cellEditor") != "person" or settings.get("multiPerson") is not True:
                settings["cellEditor"] = "person"
                settings["multiPerson"] = True
                col["settings"] = settings
                changed = True
            break

        # Status: workflow labels (Working on / Stuck / Request for approval / …).
        ghost_status_options = [
            {"id": "open", "label": "Open"},
            {"id": "in_progress", "label": "Working on"},
            {"id": "stuck", "label": "Stuck"},
            {"id": "submitted", "label": "Request for approval"},
            {"id": "changes_requested", "label": "Changes requested"},
            {"id": "approved", "label": "Approved"},
            {"id": "rejected", "label": "Rejected"},
            {"id": "fulfilled", "label": "Fulfilled"},
            {"id": "cancelled", "label": "Cancelled"},
        ]
        for col in columns:
            if str(col.get("title") or "").strip().lower() != "status":
                continue
            settings = dict(col.get("settings") or {})
            opts = list(settings.get("options") or [])
            by_id = {
                str(o.get("id")): o
                for o in opts
                if isinstance(o, dict) and o.get("id") is not None
            }
            merged: list[dict[str, Any]] = []
            for desired in ghost_status_options:
                existing_opt = by_id.get(desired["id"])
                if existing_opt is not None:
                    # Refresh label to latest wording.
                    existing_opt = dict(existing_opt)
                    existing_opt["label"] = desired["label"]
                    merged.append(existing_opt)
                else:
                    merged.append(dict(desired))
            if merged != opts:
                settings["options"] = merged
                col["settings"] = settings
                changed = True
            break

        def _ensure_col(
            *,
            meta_key: str,
            title: str,
            col_type: str,
            settings: dict[str, Any] | None = None,
            insert_after_title: str | None = None,
        ) -> str:
            nonlocal changed, meta_changed
            existing_id = meta_dict.get(meta_key)
            if isinstance(existing_id, str) and existing_id.strip():
                # Keep meta id even if column was renamed; ensure column still exists.
                if any(str(c.get("id")) == existing_id for c in columns):
                    return existing_id.strip()
            # Reuse by title if user already added one.
            hit = by_title.get(title.lower())
            if hit and hit.get("id"):
                cid = str(hit["id"])
                if meta_dict.get(meta_key) != cid:
                    meta_dict[meta_key] = cid
                    meta_changed = True
                return cid
            cid = _new_column_id()
            max_order = max((int(c.get("order", 0)) for c in columns), default=-1)
            order = max_order + 1
            if insert_after_title:
                for i, c in enumerate(columns):
                    if str(c.get("title") or "").strip().lower() == insert_after_title.lower():
                        order = int(c.get("order", i)) + 1
                        for later in columns[i + 1 :]:
                            later["order"] = int(later.get("order", 0)) + 1
                        break
            columns.append(
                {
                    "id": cid,
                    "title": title,
                    "type": col_type,
                    "order": order,
                    "settings": dict(settings or {}),
                }
            )
            by_title[title.lower()] = columns[-1]
            meta_dict[meta_key] = cid
            changed = True
            meta_changed = True
            return cid

        if missing_meta or not all(
            isinstance(meta_dict.get(k), str) and meta_dict.get(k) for k in needed
        ):
            _ensure_col(
                meta_key="ghostOpsColKindId",
                title="Kind",
                col_type="status",
                settings={"options": kind_options},
                insert_after_title="Item",
            )
            _ensure_col(
                meta_key="ghostOpsColDescriptionId",
                title="Description",
                col_type="textarea",
                insert_after_title="Kind",
            )
            _ensure_col(
                meta_key="ghostOpsColRequirementsId",
                title="Requirements",
                col_type="text",
                insert_after_title="Description",
            )

        if changed:
            await self._mt.update_definition(
                org_id=org_id,
                school_id=school_id,
                definition_id=definition_id,
                title=None,
                visibility=None,
                columns=columns,
            )
        if meta_changed or missing_meta:
            await self._school.update_school_workspace_item(
                org_id=org_id,
                school_id=school_id,
                item_id=workspace_item_id,
                updates={"metadata": meta_dict},
            )

    async def sync_ghost_ops_tree(
        self,
        *,
        org_id: str,
        school_id: str,
        host_workspace_item_id: str,
        ghost_id: str,
        title: str,
        description: str,
        requirements: str,
        implementation: str,
        status: str,
        due_at: str | None,
        variants: list[dict[str, Any]],
        chain_node: str = "",
        blocked_by: str = "",
        assignee: dict[str, Any] | None = None,
    ) -> str | None:
        """Upsert ghost parent row + nested variant rows (Monday-style). Returns parent row id."""
        item = await self._school.find_school_workspace_item(
            org_id=org_id,
            school_id=school_id,
            item_id=host_workspace_item_id,
        )
        if item is None:
            return None
        meta = item.get("metadata")
        meta_dict = dict(meta) if isinstance(meta, dict) else {}
        instance_id_raw = meta_dict.get("ghostOpsTableInstanceId")
        if not isinstance(instance_id_raw, str) or not instance_id_raw.strip():
            return None
        instance_id = instance_id_raw.strip()
        definition_id_raw = meta_dict.get("ghostOpsTableDefinitionId")
        if isinstance(definition_id_raw, str) and definition_id_raw.strip():
            await self._ensure_ghost_ops_extra_columns(
                org_id=org_id,
                school_id=school_id,
                workspace_item_id=host_workspace_item_id,
                meta_dict=meta_dict,
                definition_id=definition_id_raw.strip(),
            )
            refreshed = await self._school.find_school_workspace_item(
                org_id=org_id,
                school_id=school_id,
                item_id=host_workspace_item_id,
            )
            if refreshed is not None:
                meta = refreshed.get("metadata")
                meta_dict = dict(meta) if isinstance(meta, dict) else meta_dict

        col_title = meta_dict.get("ghostOpsColTitleId")
        col_kind = meta_dict.get("ghostOpsColKindId")
        col_desc = meta_dict.get("ghostOpsColDescriptionId")
        col_req = meta_dict.get("ghostOpsColRequirementsId")
        col_chain = meta_dict.get("ghostOpsColChainNodeId")
        col_blocked = meta_dict.get("ghostOpsColBlockedById")
        col_impl = meta_dict.get("ghostOpsColImplementationId")
        col_assignee = meta_dict.get("ghostOpsColAssigneeId")
        col_status = meta_dict.get("ghostOpsColStatusId")
        col_due = meta_dict.get("ghostOpsColDueId")
        col_open = meta_dict.get("ghostOpsColOpenId")
        required_cols = (
            col_title,
            col_chain,
            col_blocked,
            col_impl,
            col_assignee,
            col_status,
            col_due,
            col_open,
        )
        if not all(isinstance(x, str) and x for x in required_cols):
            return None

        group_id = MANAGEMENT_TABLE_DEFAULT_GROUP_ID
        ghost_open_key = f"ghost:{ghost_id}"
        prefix = f"ghost:{ghost_id}"

        rows, _total = await self._mt.list_rows(
            org_id=org_id,
            school_id=school_id,
            instance_id=instance_id,
            group_id=group_id,
            skip=0,
            limit=2000,
        )
        bundle = await self.get_instance_bundle(
            org_id=org_id, school_id=school_id, instance_id=instance_id
        )
        col_ids = {c.id for c in bundle.definition.columns}

        def _normalize_impl(raw: str) -> str:
            return raw if raw in {"same_base", "branch_base"} else "same_base"

        def _row_open_key(row: Mapping[str, Any]) -> str:
            cells = row.get("cells")
            if not isinstance(cells, dict):
                return ""
            return str(cells.get(str(col_open)) or "")

        rows_by_open: dict[str, dict[str, Any]] = {}
        for row in rows:
            key = _row_open_key(row)
            if key:
                rows_by_open[key] = row

        desired_keys: set[str] = {ghost_open_key}
        variant_keys: dict[str, str] = {}
        for v in variants:
            vid = str(v.get("id") or "").strip()
            if not vid:
                continue
            key = f"{prefix}:variant:{vid}"
            variant_keys[vid] = key
            desired_keys.add(key)

        async def _upsert_row(
            *,
            open_key: str,
            cells_patch: dict[str, Any],
            parent_row_id: str | None,
            position: int,
        ) -> str:
            existing = rows_by_open.get(open_key)
            if existing is not None:
                cells = existing.get("cells")
                merged = dict(cells) if isinstance(cells, dict) else {}
                merged.update({k: v for k, v in cells_patch.items() if k in col_ids})
                merged[str(col_open)] = open_key
                row_id = str(existing["_id"])
                await self._mt.update_row_cells(
                    org_id=org_id,
                    school_id=school_id,
                    instance_id=instance_id,
                    row_id=row_id,
                    cells=merged,
                )
                await self._mt.update_row_parent(
                    org_id=org_id,
                    school_id=school_id,
                    instance_id=instance_id,
                    row_id=row_id,
                    parent_row_id=parent_row_id,
                )
                return row_id

            cells: dict[str, Any] = {}
            for col in bundle.definition.columns:
                if col.type == "checkbox":
                    cells[col.id] = False
                elif col.type == "number":
                    cells[col.id] = None
                else:
                    cells[col.id] = ""
            cells.update({k: v for k, v in cells_patch.items() if k in col_ids})
            cells = {k: v for k, v in cells.items() if k in col_ids}
            cells[str(col_open)] = open_key
            doc = await self._mt.insert_row(
                org_id=org_id,
                school_id=school_id,
                instance_id=instance_id,
                group_id=group_id,
                position=position,
                cells=cells,
                parent_row_id=parent_row_id,
            )
            rows_by_open[open_key] = doc
            return str(doc["_id"])

        max_pos = await self._mt.max_row_position(
            org_id=org_id,
            school_id=school_id,
            instance_id=instance_id,
            group_id=group_id,
        )
        next_pos = (max_pos + 1) if max_pos is not None else 0

        ghost_cells: dict[str, Any] = {
            str(col_title): title,
            str(col_chain): chain_node or "",
            str(col_blocked): blocked_by or "",
            str(col_impl): _normalize_impl(implementation),
            str(col_assignee): assignee if isinstance(assignee, dict) else "",
            str(col_status): status,
            str(col_due): due_at or "",
            str(col_open): ghost_open_key,
        }
        if isinstance(col_kind, str) and col_kind:
            # Parent work-order stays "ghost" until fulfill publishes the real resource.
            ghost_cells[str(col_kind)] = "resource" if status == "fulfilled" else "ghost"
        if isinstance(col_desc, str) and col_desc:
            ghost_cells[str(col_desc)] = description or ""
        if isinstance(col_req, str) and col_req:
            ghost_cells[str(col_req)] = requirements or ""

        parent_row_id = await _upsert_row(
            open_key=ghost_open_key,
            cells_patch=ghost_cells,
            parent_row_id=None,
            position=next_pos,
        )
        next_pos += 1

        # Resolve parents in topological-ish order: parents before children.
        pending = list(variants)
        resolved_row_ids: dict[str, str] = {ghost_open_key: parent_row_id}
        guard = 0
        while pending and guard < len(variants) + 5:
            guard += 1
            progressed = False
            still: list[dict[str, Any]] = []
            for v in pending:
                vid = str(v.get("id") or "").strip()
                if not vid:
                    continue
                open_key = variant_keys[vid]
                parent_vid = v.get("parent_variant_id")
                parent_vid_s = str(parent_vid).strip() if parent_vid else ""
                if parent_vid_s and parent_vid_s in variant_keys:
                    parent_open = variant_keys[parent_vid_s]
                    if parent_open not in resolved_row_ids:
                        still.append(v)
                        continue
                    nest_under = resolved_row_ids[parent_open]
                else:
                    nest_under = parent_row_id

                node_status = str(v.get("status") or "open")
                if node_status == "merged":
                    node_status = "approved"
                assignee = v.get("assignee")
                variant_cells: dict[str, Any] = {
                    str(col_title): str(v.get("name") or "Variant"),
                    str(col_chain): str(v.get("name") or ""),
                    str(col_blocked): str(v.get("blocked_by") or ""),
                    str(col_impl): _normalize_impl(str(v.get("implementation") or "same_base")),
                    str(col_assignee): assignee if isinstance(assignee, dict) else "",
                    str(col_status): node_status,
                    str(col_due): due_at or "",
                    str(col_open): open_key,
                }
                if isinstance(col_kind, str) and col_kind:
                    kind_raw = str(v.get("kind") or "variant").strip().lower()
                    existing_row = rows_by_open.get(open_key)
                    if existing_row is not None:
                        existing_cells = existing_row.get("cells")
                        if isinstance(existing_cells, dict):
                            prior = str(existing_cells.get(str(col_kind)) or "").strip().lower()
                            if prior == "resource":
                                kind_raw = "resource"
                    variant_cells[str(col_kind)] = (
                        kind_raw if kind_raw in {"variant", "resource"} else "variant"
                    )
                if isinstance(col_desc, str) and col_desc:
                    variant_cells[str(col_desc)] = ""
                if isinstance(col_req, str) and col_req:
                    variant_cells[str(col_req)] = ""

                row_id = await _upsert_row(
                    open_key=open_key,
                    cells_patch=variant_cells,
                    parent_row_id=nest_under,
                    position=next_pos,
                )
                next_pos += 1
                resolved_row_ids[open_key] = row_id
                progressed = True
            pending = still
            if not progressed:
                break

        # Drop stale rows for this ghost (deleted variants / legacy flat duplicates).
        for row in rows:
            key = _row_open_key(row)
            if key != prefix and not key.startswith(f"{prefix}:variant:"):
                continue
            if key in desired_keys:
                continue
            await self._mt.delete_row(
                org_id=org_id,
                school_id=school_id,
                instance_id=instance_id,
                row_id=str(row["_id"]),
            )

        return parent_row_id

    async def remove_ghost_ops_tree(
        self,
        *,
        org_id: str,
        school_id: str,
        host_workspace_item_id: str,
        ghost_id: str,
    ) -> None:
        """Delete all Ghost Ops mirror rows for a cancelled/removed ghost."""
        item = await self._school.find_school_workspace_item(
            org_id=org_id,
            school_id=school_id,
            item_id=host_workspace_item_id,
        )
        if item is None:
            return
        meta = item.get("metadata")
        meta_dict = dict(meta) if isinstance(meta, dict) else {}
        instance_id_raw = meta_dict.get("ghostOpsTableInstanceId")
        if not isinstance(instance_id_raw, str) or not instance_id_raw.strip():
            return
        instance_id = instance_id_raw.strip()
        group_id = MANAGEMENT_TABLE_DEFAULT_GROUP_ID
        prefix = f"ghost:{ghost_id.strip()}"
        rows, _total = await self._mt.list_rows(
            org_id=org_id,
            school_id=school_id,
            instance_id=instance_id,
            group_id=group_id,
            skip=0,
            limit=2000,
        )

        def _row_matches(row: Mapping[str, Any]) -> bool:
            cells = row.get("cells")
            if not isinstance(cells, dict):
                return False
            for raw in cells.values():
                key = str(raw or "").strip()
                if key == prefix or key.startswith(f"{prefix}:variant:"):
                    return True
            return False

        matching = [row for row in rows if _row_matches(row)]
        if not matching:
            return

        # Delete roots first (no parent among matching); delete_row cascades descendants.
        matching_ids = {str(r["_id"]) for r in matching}
        roots = [
            str(r["_id"])
            for r in matching
            if str(r.get("parent_row_id") or "").strip() not in matching_ids
        ]
        targets = roots or [str(r["_id"]) for r in matching]
        for row_id in targets:
            try:
                await self.delete_row(
                    org_id=org_id,
                    school_id=school_id,
                    instance_id=instance_id,
                    row_id=row_id,
                )
            except Exception:
                continue

    async def sync_ghost_ops_row(
        self,
        *,
        org_id: str,
        school_id: str,
        host_workspace_item_id: str,
        ghost_id: str,
        title: str,
        chain_node: str,
        blocked_by: str,
        implementation: str,
        assignee: dict[str, Any] | None,
        status: str,
        due_at: str | None,
        open_href: str,
    ) -> str | None:
        """Backward-compatible single-row upsert; prefer sync_ghost_ops_tree."""
        _ = open_href
        return await self.sync_ghost_ops_tree(
            org_id=org_id,
            school_id=school_id,
            host_workspace_item_id=host_workspace_item_id,
            ghost_id=ghost_id,
            title=title,
            description="",
            requirements="",
            implementation=implementation,
            status=status,
            due_at=due_at,
            variants=[],
            chain_node=chain_node,
            blocked_by=blocked_by,
            assignee=assignee,
        )

    async def bootstrap_class_assignments_table(
        self,
        *,
        org_id: str,
        school_id: str,
        user_id: str,
        class_workspace_item_id: str,
    ) -> ManagementTableWorkspaceBootstrapResponse:
        return await self.bootstrap_assignments_table_workspace_item(
            org_id=org_id,
            school_id=school_id,
            user_id=user_id,
            workspace_item_id=class_workspace_item_id,
            allowed_types=frozenset({"class"}),
            invalid_type_code="class_assignments_table_workspace_type_invalid",
        )

    async def sync_class_enrollment_row(
        self,
        *,
        org_id: str,
        school_id: str,
        class_workspace_item_id: str,
        student_name: str,
        email: str | None,
        user_id: str | None = None,
    ) -> None:
        item = await self._school.find_school_workspace_item(
            org_id=org_id,
            school_id=school_id,
            item_id=class_workspace_item_id,
        )
        if item is None:
            return
        meta = item.get("metadata")
        meta_dict = dict(meta) if isinstance(meta, dict) else {}
        instance_id = meta_dict.get("studentsTableInstanceId")
        student_col_id = meta_dict.get("studentsTableStudentColumnId")
        if not isinstance(instance_id, str) or not instance_id.strip():
            return
        if not isinstance(student_col_id, str):
            return
        normalized_user_id = (user_id or "").strip()
        group_id = MANAGEMENT_TABLE_DEFAULT_GROUP_ID
        rows, _total = await self._mt.list_rows(
            org_id=org_id,
            school_id=school_id,
            instance_id=instance_id.strip(),
            group_id=group_id,
            skip=0,
            limit=1000,
        )
        person_value: dict[str, Any] = {
            "userId": normalized_user_id,
            "fullName": student_name.strip(),
            "email": (email or "").strip() or None,
        }
        if normalized_user_id:
            for row in rows:
                cells = row.get("cells")
                if not isinstance(cells, dict):
                    continue
                raw = cells.get(student_col_id)
                if isinstance(raw, dict) and str(raw.get("userId", "")) == normalized_user_id:
                    existing_cells = dict(cells)
                    existing_cells[student_col_id] = person_value
                    await self._mt.update_row_cells(
                        org_id=org_id,
                        school_id=school_id,
                        instance_id=instance_id.strip(),
                        row_id=str(row["_id"]),
                        cells=existing_cells,
                    )
                    return
        bundle = await self.get_instance_bundle(
            org_id=org_id,
            school_id=school_id,
            instance_id=instance_id.strip(),
        )
        col_ids = {c.id for c in bundle.definition.columns}
        max_pos = await self._mt.max_row_position(
            org_id=org_id,
            school_id=school_id,
            instance_id=instance_id.strip(),
            group_id=group_id,
        )
        position = (max_pos + 1) if max_pos is not None else 0
        cells: dict[str, Any] = {}
        for col in bundle.definition.columns:
            if col.type == "checkbox":
                cells[col.id] = False
            elif col.type == "number":
                cells[col.id] = None
            else:
                cells[col.id] = ""
        cells = {k: v for k, v in cells.items() if k in col_ids}
        if student_col_id in cells:
            cells[student_col_id] = person_value
        await self._mt.insert_row(
            org_id=org_id,
            school_id=school_id,
            instance_id=instance_id.strip(),
            group_id=group_id,
            position=position,
            cells=cells,
        )
