"""Business logic for management tables."""

from __future__ import annotations

from typing import Any
from uuid import uuid4

from app.core.exceptions import NotFoundError, PermissionDeniedError, ValidationError
from app.domain.management_table.repository import ManagementTableRepository
from app.domain.management_table.schemas import (
    MANAGEMENT_TABLE_DEFAULT_GROUP_ID,
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
        if ws_id:
            existing = await self._mt.find_instance_by_workspace_item(
                org_id=org_id,
                school_id=school_id,
                workspace_item_id=ws_id,
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
            inst = await self._mt.find_instance(
                org_id=org_id,
                school_id=school_id,
                instance_id=existing_id.strip(),
            )
            if inst is not None:
                bundle = await self.get_instance_bundle(
                    org_id=org_id,
                    school_id=school_id,
                    instance_id=existing_id.strip(),
                )
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
            inst = await self._mt.find_instance(
                org_id=org_id,
                school_id=school_id,
                instance_id=existing_id.strip(),
            )
            if inst is not None:
                bundle = await self.get_instance_bundle(
                    org_id=org_id,
                    school_id=school_id,
                    instance_id=existing_id.strip(),
                )
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
            inst = await self._mt.find_instance(
                org_id=org_id,
                school_id=school_id,
                instance_id=existing_id,
            )
            if inst is not None:
                bundle = await self.get_instance_bundle(
                    org_id=org_id,
                    school_id=school_id,
                    instance_id=existing_id,
                )
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
            inst = await self._mt.find_instance(
                org_id=org_id,
                school_id=school_id,
                instance_id=existing_id,
            )
            if inst is not None:
                bundle = await self.get_instance_bundle(
                    org_id=org_id,
                    school_id=school_id,
                    instance_id=existing_id,
                )
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
            inst = await self._mt.find_instance(
                org_id=org_id,
                school_id=school_id,
                instance_id=existing_id,
            )
            if inst is not None:
                bundle = await self.get_instance_bundle(
                    org_id=org_id,
                    school_id=school_id,
                    instance_id=existing_id,
                )
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
            inst = await self._mt.find_instance(
                org_id=org_id,
                school_id=school_id,
                instance_id=existing_id,
            )
            if inst is not None:
                bundle = await self.get_instance_bundle(
                    org_id=org_id,
                    school_id=school_id,
                    instance_id=existing_id,
                )
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
            inst = await self._mt.find_instance(
                org_id=org_id,
                school_id=school_id,
                instance_id=existing_id,
            )
            if inst is not None:
                bundle = await self.get_instance_bundle(
                    org_id=org_id,
                    school_id=school_id,
                    instance_id=existing_id,
                )
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
            page=1,
            page_size=1000,
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
