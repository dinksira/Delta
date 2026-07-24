"""Business logic for school Ghost Resources (host-agnostic)."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Mapping

from pymongo.errors import DuplicateKeyError

from app.core.exceptions import ConflictError, NotFoundError, ValidationError
from app.domain.ghost_resources.adapters import HostAdapterRegistry
from app.domain.ghost_resources.graph import MAX_EDGES, MAX_NODES, would_create_cycle
from app.domain.ghost_resources.repository import (
    GhostResourcesRepository,
    new_edge_id,
    new_event_id,
    new_ghost_id,
    new_variant_id,
)
from app.domain.ghost_resources.schemas import (
    GhostCreateInput,
    GhostEdgeCreateInput,
    GhostEdgePublic,
    GhostEventListResponse,
    GhostEventPublic,
    GhostFulfillInput,
    GhostListResponse,
    GhostMyWorkItemPublic,
    GhostMyWorkResponse,
    GhostNodeCreateInput,
    GhostNodePublic,
    GhostNodeReviewInput,
    GhostNodeSubmitInput,
    GhostNodeUpdateInput,
    GhostPublic,
    GhostRequirementAttachmentPublic,
    GhostUpdateInput,
)
from app.domain.management_table.service import ManagementTableService
from app.domain.school.repository import Repository as SchoolRepository


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


_APPROVED_STATUSES = frozenset({"approved", "merged"})


class GhostResourcesService:
    def __init__(
        self,
        *,
        ghost_repo: GhostResourcesRepository,
        school_repo: SchoolRepository,
        mt_service: ManagementTableService | None = None,
    ) -> None:
        self._g = ghost_repo
        self._school = school_repo
        self._mt = mt_service
        self._adapters = HostAdapterRegistry(school_repo)

    async def bootstrap(self) -> None:
        await self._g.ensure_indexes()

    async def _require_school(self, *, org_id: str, school_id: str) -> None:
        school = await self._school.find_school(org_id=org_id, school_id=school_id)
        if school is None:
            raise NotFoundError("School not found.", code="school_not_found")

    async def _require_host(
        self,
        *,
        org_id: str,
        school_id: str,
        host_type: str,
        host_workspace_item_id: str,
    ) -> None:
        await self._require_school(org_id=org_id, school_id=school_id)
        if host_type == "school":
            return
        item = await self._school.find_school_workspace_item(
            org_id=org_id,
            school_id=school_id,
            item_id=host_workspace_item_id,
        )
        if item is None:
            raise NotFoundError("Host workspace item not found.", code="ghost_host_not_found")
        item_type = str(item.get("type") or "")
        if host_type in {"course", "class", "department"} and item_type != host_type:
            raise ValidationError(
                f"Workspace item type '{item_type}' does not match hostType '{host_type}'.",
                code="ghost_host_type_mismatch",
            )

    def _map_attachment(self, raw: Mapping[str, Any]) -> GhostRequirementAttachmentPublic:
        return GhostRequirementAttachmentPublic(
            media_id=str(raw.get("media_id") or ""),
            file_name=str(raw.get("file_name") or ""),
        )

    def _map_node(
        self,
        doc: Mapping[str, Any],
        *,
        blocked_by: list[str] | None = None,
    ) -> GhostNodePublic:
        blocked_ids = list(blocked_by or [])
        submission = doc.get("submission") or {}
        working = doc.get("working_head") or {}
        return GhostNodePublic(
            id=str(doc["_id"]),
            ghost_id=str(doc["ghost_id"]),
            name=str(doc.get("name") or ""),
            role=str(doc.get("role") or "variant"),  # type: ignore[arg-type]
            is_default=bool(doc.get("is_default")),
            required=bool(doc.get("required")),
            implementation_type=str(doc.get("implementation_type") or "same_base"),  # type: ignore[arg-type]
            assignee_user_ids=[str(x) for x in (doc.get("assignee_user_ids") or [])],
            status=str(doc.get("status") or "open"),  # type: ignore[arg-type]
            blocked=bool(blocked_ids),
            blocked_by_variant_ids=blocked_ids,
            available_inputs=[dict(x) for x in (doc.get("available_inputs") or [])],
            submission_note=(
                str(submission["note"]) if isinstance(submission, dict) and submission.get("note") else None
            ),
            forked_from_variant_id=(
                str(doc["forked_from_variant_id"]) if doc.get("forked_from_variant_id") else None
            ),
            working_head_version=int(
                working.get("version") if isinstance(working, dict) else 1
            )
            or 1,
            sort_order=int(doc.get("sort_order") or 0),
            created_at=doc["created_at"],
            updated_at=doc["updated_at"],
        )

    def _blocked_by_map(
        self,
        *,
        node_docs: list[dict[str, Any]],
        edge_docs: list[dict[str, Any]],
    ) -> dict[str, list[str]]:
        status_by_id = {
            str(n["_id"]): str(n.get("status") or "open") for n in node_docs
        }
        blocked: dict[str, list[str]] = {str(n["_id"]): [] for n in node_docs}
        for e in edge_docs:
            frm = str(e["from_variant_id"])
            to = str(e["to_variant_id"])
            if status_by_id.get(frm) not in _APPROVED_STATUSES:
                if to in blocked:
                    blocked[to].append(frm)
        return blocked

    def _fulfill_ready(
        self,
        *,
        ghost_doc: Mapping[str, Any],
        node_docs: list[dict[str, Any]],
        edge_docs: list[dict[str, Any]],
        end_variant_id: str | None,
    ) -> tuple[bool, str | None, dict[str, Any] | None]:
        """Return (ok, error_code, end_node)."""
        if str(ghost_doc.get("status") or "") == "fulfilled":
            return False, "ghost_already_fulfilled", None
        if str(ghost_doc.get("status") or "") == "cancelled":
            return False, "ghost_cancelled", None

        by_id = {str(n["_id"]): n for n in node_docs}
        end_id = end_variant_id or (
            str(ghost_doc["default_variant_id"]) if ghost_doc.get("default_variant_id") else None
        )
        if not end_id or end_id not in by_id:
            end_node = next((n for n in node_docs if bool(n.get("is_default"))), None)
            if end_node is None:
                return False, "ghost_end_missing", None
            end_id = str(end_node["_id"])
        else:
            end_node = by_id[end_id]

        if str(end_node.get("status") or "") not in _APPROVED_STATUSES:
            return False, "ghost_end_not_approved", end_node

        # All required nodes that can reach the end (ancestors via reverse edges) must be approved
        incoming: dict[str, list[str]] = {str(n["_id"]): [] for n in node_docs}
        for e in edge_docs:
            incoming[str(e["to_variant_id"])].append(str(e["from_variant_id"]))

        ancestors: set[str] = set()
        stack = list(incoming.get(end_id, []))
        while stack:
            cur = stack.pop()
            if cur in ancestors:
                continue
            ancestors.add(cur)
            stack.extend(incoming.get(cur, []))

        for n in node_docs:
            nid = str(n["_id"])
            if not bool(n.get("required")):
                continue
            if nid != end_id and nid not in ancestors:
                continue
            if str(n.get("status") or "") not in _APPROVED_STATUSES:
                return False, "ghost_required_deps_pending", end_node
        return True, None, end_node

    def _map_edge(self, doc: Mapping[str, Any]) -> GhostEdgePublic:
        return GhostEdgePublic(
            id=str(doc["_id"]),
            ghost_id=str(doc["ghost_id"]),
            from_variant_id=str(doc["from_variant_id"]),
            to_variant_id=str(doc["to_variant_id"]),
            created_at=doc["created_at"],
        )

    def _map_event(self, doc: Mapping[str, Any]) -> GhostEventPublic:
        return GhostEventPublic(
            id=str(doc["_id"]),
            ghost_id=str(doc["ghost_id"]),
            type=str(doc.get("type") or ""),
            actor_user_id=str(doc.get("actor_user_id") or ""),
            meta=dict(doc.get("meta") or {}),
            created_at=doc["created_at"],
        )

    async def _map_ghost(
        self,
        doc: Mapping[str, Any],
        *,
        include_graph: bool = True,
    ) -> GhostPublic:
        nodes: list[GhostNodePublic] = []
        edges: list[GhostEdgePublic] = []
        if include_graph:
            node_docs = await self._g.list_variants(ghost_id=str(doc["_id"]))
            edge_docs = await self._g.list_edges(ghost_id=str(doc["_id"]))
            blocked_map = self._blocked_by_map(node_docs=node_docs, edge_docs=edge_docs)
            nodes = [
                self._map_node(n, blocked_by=blocked_map.get(str(n["_id"]), []))
                for n in node_docs
            ]
            edges = [self._map_edge(e) for e in edge_docs]
            can_fulfill, _, _ = self._fulfill_ready(
                ghost_doc=doc,
                node_docs=node_docs,
                edge_docs=edge_docs,
                end_variant_id=None,
            )
        else:
            can_fulfill = False
        attachments = [
            self._map_attachment(a) for a in (doc.get("requirement_attachments") or [])
        ]
        promoted = doc.get("promoted_resource")
        return GhostPublic(
            id=str(doc["_id"]),
            org_id=str(doc["org_id"]),
            school_id=str(doc["school_id"]),
            host_type=str(doc.get("host_type") or "course"),  # type: ignore[arg-type]
            host_workspace_item_id=str(doc.get("host_workspace_item_id") or ""),
            title=str(doc.get("title") or ""),
            description=str(doc.get("description") or ""),
            requirement_attachments=attachments,
            implementation_type=str(doc.get("implementation_type") or "same_base"),  # type: ignore[arg-type]
            due_at=doc.get("due_at"),
            resource_kind=str(doc.get("resource_kind") or "document"),
            slot_key=str(doc.get("slot_key") or ""),
            status=str(doc.get("status") or "open"),  # type: ignore[arg-type]
            default_variant_id=(
                str(doc["default_variant_id"]) if doc.get("default_variant_id") else None
            ),
            created_by_user_id=str(doc.get("created_by_user_id") or ""),
            created_at=doc["created_at"],
            updated_at=doc["updated_at"],
            promoted_resource=dict(promoted) if isinstance(promoted, dict) else None,
            can_fulfill=can_fulfill,
            nodes=nodes,
            edges=edges,
        )

    async def _append_event(
        self,
        *,
        org_id: str,
        school_id: str,
        ghost_id: str,
        event_type: str,
        actor_user_id: str,
        meta: dict[str, Any] | None = None,
    ) -> None:
        now = _utcnow()
        await self._g.insert_event(
            {
                "_id": new_event_id(),
                "org_id": org_id,
                "school_id": school_id,
                "ghost_id": ghost_id,
                "type": event_type,
                "actor_user_id": actor_user_id,
                "meta": meta or {},
                "created_at": now,
            }
        )

    async def _assignee_person(self, user_ids: list[str]) -> dict[str, Any] | None:
        if not user_ids:
            return None
        uid = user_ids[0]
        profile = await self._school.find_user_profile(user_id=uid)
        if profile is not None:
            return {
                "userId": uid,
                "fullName": str(profile.get("full_name") or profile.get("username") or ""),
                "username": str(profile.get("username") or ""),
            }
        return {"userId": uid, "fullName": uid}

    async def _sync_ops_mirror(
        self,
        *,
        org_id: str,
        school_id: str,
        ghost_id: str,
    ) -> None:
        if self._mt is None:
            return
        doc = await self._g.find_instance(org_id=org_id, school_id=school_id, ghost_id=ghost_id)
        if doc is None:
            return
        host_id = str(doc.get("host_workspace_item_id") or "")
        if not host_id:
            return
        node_docs = await self._g.list_variants(ghost_id=ghost_id)
        edge_docs = await self._g.list_edges(ghost_id=ghost_id)
        blocked_map = self._blocked_by_map(node_docs=node_docs, edge_docs=edge_docs)
        by_id = {str(n["_id"]): n for n in node_docs}

        # Edge direction from→to nests the dependent under the requirement (Monday subitems).
        parent_of: dict[str, str] = {}
        for e in edge_docs:
            frm = str(e["from_variant_id"])
            to = str(e["to_variant_id"])
            if to not in parent_of:
                parent_of[to] = frm

        due = doc.get("due_at")
        due_str: str | None = None
        if isinstance(due, datetime):
            due_str = due.date().isoformat()
        elif due is not None:
            due_str = str(due)[:10]

        ghost_status = str(doc.get("status") or "open")
        req_parts: list[str] = []
        for a in doc.get("requirement_attachments") or []:
            if not isinstance(a, dict):
                continue
            name = str(a.get("file_name") or a.get("fileName") or "").strip()
            mid = str(a.get("media_id") or a.get("mediaId") or "").strip()
            if name and mid:
                # Encoded so MT can open the asset; legacy plain names still parse.
                req_parts.append(f"{name}||{mid}")
            elif name:
                req_parts.append(name)

        # Prefer default / end node for parent-row ops fields.
        end_id = str(doc["default_variant_id"]) if doc.get("default_variant_id") else None
        end = by_id.get(end_id) if end_id else None
        if end is None:
            end = next((n for n in node_docs if bool(n.get("is_default"))), None)
        if end is None and node_docs:
            end = node_docs[0]
        end_id = str(end["_id"]) if end else ""

        end_blocked_ids = blocked_map.get(end_id, []) if end_id else []
        end_blocked_names = [
            str(by_id[b].get("name") or b) for b in end_blocked_ids if b in by_id
        ]
        end_assignee = await self._assignee_person(
            [str(x) for x in ((end or {}).get("assignee_user_ids") or [])]
        )
        end_impl = str(
            (end or {}).get("implementation_type")
            or doc.get("implementation_type")
            or "same_base"
        )
        end_name = str((end or {}).get("name") or "")
        node_status = str((end or {}).get("status") or "open")
        if node_status == "merged":
            node_status = "approved"
        parent_status = (
            ghost_status if ghost_status in {"fulfilled", "cancelled"} else node_status
        )

        # Solo default/first variant = the main ghost row — no nested subitem table.
        # Only create variant subitems when there is more than one chain node.
        variants_payload: list[dict[str, Any]] = []
        if len(node_docs) > 1:
            for n in sorted(node_docs, key=lambda x: int(x.get("sort_order") or 0)):
                vid = str(n["_id"])
                blocked_ids = blocked_map.get(vid, [])
                blocked_names = [
                    str(by_id[b].get("name") or b) for b in blocked_ids if b in by_id
                ]
                assignee_ids = [str(x) for x in (n.get("assignee_user_ids") or [])]
                variants_payload.append(
                    {
                        "id": vid,
                        "name": str(n.get("name") or "Variant"),
                        "parent_variant_id": parent_of.get(vid),
                        "implementation": str(
                            n.get("implementation_type")
                            or doc.get("implementation_type")
                            or "same_base"
                        ),
                        "status": str(n.get("status") or "open"),
                        "assignee": await self._assignee_person(assignee_ids),
                        "blocked_by": ", ".join(blocked_names),
                    }
                )

        row_id = await self._mt.sync_ghost_ops_tree(
            org_id=org_id,
            school_id=school_id,
            host_workspace_item_id=host_id,
            ghost_id=ghost_id,
            title=str(doc.get("title") or end_name or "Ghost"),
            description=str(doc.get("description") or ""),
            requirements=" ;; ".join(req_parts),
            implementation=end_impl,
            status=parent_status,
            due_at=due_str,
            variants=variants_payload,
            chain_node=end_name if len(node_docs) <= 1 else "",
            blocked_by=", ".join(end_blocked_names) if len(node_docs) <= 1 else "",
            assignee=end_assignee if len(node_docs) <= 1 else None,
        )
        if row_id:
            refs = dict(doc.get("management_table_refs") or {})
            item_meta = await self._school.find_school_workspace_item(
                org_id=org_id, school_id=school_id, item_id=host_id
            )
            meta = dict((item_meta or {}).get("metadata") or {}) if item_meta else {}
            refs.update(
                {
                    "instanceId": meta.get("ghostOpsTableInstanceId"),
                    "definitionId": meta.get("ghostOpsTableDefinitionId"),
                    "rowId": row_id,
                }
            )
            await self._g.update_instance(
                org_id=org_id,
                school_id=school_id,
                ghost_id=ghost_id,
                patch={"management_table_refs": refs},
            )

    async def list_ghosts(
        self,
        *,
        org_id: str,
        school_id: str,
        host_type: str | None = None,
        host_workspace_item_id: str | None = None,
        status: str | None = None,
    ) -> GhostListResponse:
        await self._require_school(org_id=org_id, school_id=school_id)
        docs, total = await self._g.list_instances(
            org_id=org_id,
            school_id=school_id,
            host_type=host_type,
            host_workspace_item_id=host_workspace_item_id,
            status=status,
        )
        items = [await self._map_ghost(d, include_graph=False) for d in docs]
        return GhostListResponse(items=items, total=total)

    async def get_ghost(
        self,
        *,
        org_id: str,
        school_id: str,
        ghost_id: str,
    ) -> GhostPublic:
        doc = await self._g.find_instance(org_id=org_id, school_id=school_id, ghost_id=ghost_id)
        if doc is None:
            raise NotFoundError("Ghost not found.", code="ghost_not_found")
        return await self._map_ghost(doc, include_graph=True)

    async def create_ghost(
        self,
        *,
        org_id: str,
        school_id: str,
        user_id: str,
        payload: GhostCreateInput,
    ) -> GhostPublic:
        await self._require_host(
            org_id=org_id,
            school_id=school_id,
            host_type=payload.host_type,
            host_workspace_item_id=payload.host_workspace_item_id,
        )
        now = _utcnow()
        ghost_id = new_ghost_id()
        default_variant_id = new_variant_id()
        default_name = (payload.default_node_name or "Default").strip() or "Default"
        title = payload.title.strip() or default_name
        description = payload.description.strip()

        instance = {
            "_id": ghost_id,
            "org_id": org_id,
            "school_id": school_id,
            "host_type": payload.host_type,
            "host_workspace_item_id": payload.host_workspace_item_id.strip(),
            "title": title,
            "description": description,
            "requirement_attachments": [],
            "implementation_type": payload.implementation_type,
            "due_at": payload.due_at,
            "resource_kind": payload.resource_kind.strip() or "document",
            "slot_key": payload.slot_key.strip(),
            "status": "open",
            "default_variant_id": default_variant_id,
            "created_by_user_id": user_id,
            "created_at": now,
            "updated_at": now,
        }
        await self._g.insert_instance(instance)

        node = {
            "_id": default_variant_id,
            "ghost_id": ghost_id,
            "name": f"{default_name} (default)" if "(default)" not in default_name.lower() else default_name,
            "role": "end",
            "is_default": True,
            "required": True,
            "implementation_type": payload.implementation_type,
            "assignee_user_ids": [],
            "working_head": {"version": 1, "mode": payload.implementation_type},
            "available_inputs": [],
            "status": "open",
            "sort_order": 0,
            "created_at": now,
            "updated_at": now,
        }
        await self._g.insert_variant(node)
        await self._append_event(
            org_id=org_id,
            school_id=school_id,
            ghost_id=ghost_id,
            event_type="created",
            actor_user_id=user_id,
            meta={"hostType": payload.host_type, "defaultVariantId": default_variant_id},
        )
        await self._sync_ops_mirror(org_id=org_id, school_id=school_id, ghost_id=ghost_id)
        return await self.get_ghost(org_id=org_id, school_id=school_id, ghost_id=ghost_id)

    async def update_ghost(
        self,
        *,
        org_id: str,
        school_id: str,
        ghost_id: str,
        user_id: str,
        payload: GhostUpdateInput,
    ) -> GhostPublic:
        doc = await self._g.find_instance(org_id=org_id, school_id=school_id, ghost_id=ghost_id)
        if doc is None:
            raise NotFoundError("Ghost not found.", code="ghost_not_found")
        patch: dict[str, Any] = {}
        if payload.title is not None:
            patch["title"] = payload.title.strip()
        if payload.description is not None:
            patch["description"] = payload.description.strip()
        if payload.implementation_type is not None:
            patch["implementation_type"] = payload.implementation_type
        if "due_at" in payload.model_fields_set:
            patch["due_at"] = payload.due_at
        if payload.requirement_attachments is not None:
            patch["requirement_attachments"] = [
                {"media_id": a.media_id, "file_name": a.file_name}
                for a in payload.requirement_attachments
            ]
        if payload.status is not None:
            patch["status"] = payload.status
        if not patch:
            raise ValidationError("No changes provided.", code="ghost_update_empty")
        updated = await self._g.update_instance(
            org_id=org_id,
            school_id=school_id,
            ghost_id=ghost_id,
            patch=patch,
        )
        assert updated is not None
        await self._append_event(
            org_id=org_id,
            school_id=school_id,
            ghost_id=ghost_id,
            event_type="property_updated",
            actor_user_id=user_id,
            meta={"fields": list(patch.keys())},
        )
        await self._sync_ops_mirror(org_id=org_id, school_id=school_id, ghost_id=ghost_id)
        return await self._map_ghost(updated, include_graph=True)

    async def create_node(
        self,
        *,
        org_id: str,
        school_id: str,
        ghost_id: str,
        user_id: str,
        payload: GhostNodeCreateInput,
    ) -> GhostPublic:
        doc = await self._g.find_instance(org_id=org_id, school_id=school_id, ghost_id=ghost_id)
        if doc is None:
            raise NotFoundError("Ghost not found.", code="ghost_not_found")
        count = await self._g.count_variants(ghost_id=ghost_id)
        if count >= MAX_NODES:
            raise ValidationError(
                f"Chain may have at most {MAX_NODES} nodes.",
                code="ghost_node_limit",
            )
        now = _utcnow()
        variant_id = new_variant_id()
        forked_from: str | None = None
        working_head: dict[str, Any] = {"version": 1, "mode": payload.implementation_type}

        connect_from = payload.connect_from_variant_id
        if connect_from:
            parent = await self._g.find_variant(ghost_id=ghost_id, variant_id=connect_from)
            if parent is not None:
                parent_head = dict(parent.get("working_head") or {})
                if payload.implementation_type == "branch_base":
                    # GitHub-like: isolated fork of parent head
                    forked_from = connect_from
                    working_head = {
                        **parent_head,
                        "version": 1,
                        "mode": "branch_base",
                        "forkedFromVersion": int(parent_head.get("version") or 1),
                    }
                else:
                    # Figma-like Same Base: start from shared head snapshot, versions continue
                    working_head = {
                        **parent_head,
                        "version": int(parent_head.get("version") or 1),
                        "mode": "same_base",
                        "sharedFromVariantId": connect_from,
                    }

        node = {
            "_id": variant_id,
            "ghost_id": ghost_id,
            "name": payload.name.strip(),
            "role": payload.role,
            "is_default": bool(payload.is_default),
            "required": bool(payload.required),
            "implementation_type": payload.implementation_type,
            "assignee_user_ids": [],
            "working_head": working_head,
            "forked_from_variant_id": forked_from,
            "available_inputs": [],
            "status": "open",
            "sort_order": count,
            "created_at": now,
            "updated_at": now,
        }
        await self._g.insert_variant(node)

        if connect_from:
            await self._create_edge_internal(
                org_id=org_id,
                school_id=school_id,
                ghost_id=ghost_id,
                user_id=user_id,
                from_variant_id=connect_from,
                to_variant_id=variant_id,
            )

        await self._append_event(
            org_id=org_id,
            school_id=school_id,
            ghost_id=ghost_id,
            event_type="variant_added",
            actor_user_id=user_id,
            meta={
                "variantId": variant_id,
                "name": node["name"],
                "implementationType": payload.implementation_type,
                "forkedFromVariantId": forked_from,
            },
        )
        await self._sync_ops_mirror(org_id=org_id, school_id=school_id, ghost_id=ghost_id)
        return await self.get_ghost(org_id=org_id, school_id=school_id, ghost_id=ghost_id)

    async def update_node(
        self,
        *,
        org_id: str,
        school_id: str,
        ghost_id: str,
        variant_id: str,
        user_id: str,
        payload: GhostNodeUpdateInput,
    ) -> GhostPublic:
        doc = await self._g.find_instance(org_id=org_id, school_id=school_id, ghost_id=ghost_id)
        if doc is None:
            raise NotFoundError("Ghost not found.", code="ghost_not_found")
        existing = await self._g.find_variant(ghost_id=ghost_id, variant_id=variant_id)
        if existing is None:
            raise NotFoundError("Chain node not found.", code="ghost_variant_not_found")
        patch: dict[str, Any] = {}
        if payload.name is not None:
            patch["name"] = payload.name.strip()
        if payload.implementation_type is not None:
            patch["implementation_type"] = payload.implementation_type
        if payload.required is not None:
            patch["required"] = payload.required
        if payload.status is not None:
            patch["status"] = payload.status
        if payload.assignee_user_ids is not None:
            patch["assignee_user_ids"] = [str(x).strip() for x in payload.assignee_user_ids if str(x).strip()]
        if not patch:
            raise ValidationError("No changes provided.", code="ghost_variant_update_empty")
        await self._g.update_variant(ghost_id=ghost_id, variant_id=variant_id, patch=patch)
        await self._append_event(
            org_id=org_id,
            school_id=school_id,
            ghost_id=ghost_id,
            event_type="variant_updated",
            actor_user_id=user_id,
            meta={"variantId": variant_id, "fields": list(patch.keys())},
        )
        await self._sync_ops_mirror(org_id=org_id, school_id=school_id, ghost_id=ghost_id)
        return await self.get_ghost(org_id=org_id, school_id=school_id, ghost_id=ghost_id)

    async def _create_edge_internal(
        self,
        *,
        org_id: str,
        school_id: str,
        ghost_id: str,
        user_id: str,
        from_variant_id: str,
        to_variant_id: str,
    ) -> dict[str, Any]:
        if from_variant_id == to_variant_id:
            raise ValidationError("Edge cannot connect a node to itself.", code="ghost_edge_self")
        frm = await self._g.find_variant(ghost_id=ghost_id, variant_id=from_variant_id)
        to = await self._g.find_variant(ghost_id=ghost_id, variant_id=to_variant_id)
        if frm is None or to is None:
            raise NotFoundError("Edge endpoints not found.", code="ghost_edge_endpoint_missing")
        edge_count = await self._g.count_edges(ghost_id=ghost_id)
        if edge_count >= MAX_EDGES:
            raise ValidationError(
                f"Chain may have at most {MAX_EDGES} edges.",
                code="ghost_edge_limit",
            )
        existing_edges = await self._g.list_edges(ghost_id=ghost_id)
        pairs = [(str(e["from_variant_id"]), str(e["to_variant_id"])) for e in existing_edges]
        if would_create_cycle(edges=pairs, new_from=from_variant_id, new_to=to_variant_id):
            raise ValidationError("Chain edge would create a cycle.", code="ghost_edge_cycle")
        now = _utcnow()
        edge = {
            "_id": new_edge_id(),
            "ghost_id": ghost_id,
            "from_variant_id": from_variant_id,
            "to_variant_id": to_variant_id,
            "on_complete": ["notify", "unlock", "attach_output"],
            "created_at": now,
        }
        try:
            await self._g.insert_edge(edge)
        except DuplicateKeyError as exc:
            raise ConflictError("Edge already exists.", code="ghost_edge_duplicate") from exc
        await self._append_event(
            org_id=org_id,
            school_id=school_id,
            ghost_id=ghost_id,
            event_type="edge_added",
            actor_user_id=user_id,
            meta={"fromVariantId": from_variant_id, "toVariantId": to_variant_id},
        )
        return edge

    async def create_edge(
        self,
        *,
        org_id: str,
        school_id: str,
        ghost_id: str,
        user_id: str,
        payload: GhostEdgeCreateInput,
    ) -> GhostPublic:
        doc = await self._g.find_instance(org_id=org_id, school_id=school_id, ghost_id=ghost_id)
        if doc is None:
            raise NotFoundError("Ghost not found.", code="ghost_not_found")
        await self._create_edge_internal(
            org_id=org_id,
            school_id=school_id,
            ghost_id=ghost_id,
            user_id=user_id,
            from_variant_id=payload.from_variant_id,
            to_variant_id=payload.to_variant_id,
        )
        await self._sync_ops_mirror(org_id=org_id, school_id=school_id, ghost_id=ghost_id)
        return await self.get_ghost(org_id=org_id, school_id=school_id, ghost_id=ghost_id)

    async def delete_edge(
        self,
        *,
        org_id: str,
        school_id: str,
        ghost_id: str,
        edge_id: str,
        user_id: str,
    ) -> GhostPublic:
        doc = await self._g.find_instance(org_id=org_id, school_id=school_id, ghost_id=ghost_id)
        if doc is None:
            raise NotFoundError("Ghost not found.", code="ghost_not_found")
        ok = await self._g.delete_edge(ghost_id=ghost_id, edge_id=edge_id)
        if not ok:
            raise NotFoundError("Edge not found.", code="ghost_edge_not_found")
        await self._append_event(
            org_id=org_id,
            school_id=school_id,
            ghost_id=ghost_id,
            event_type="edge_removed",
            actor_user_id=user_id,
            meta={"edgeId": edge_id},
        )
        await self._sync_ops_mirror(org_id=org_id, school_id=school_id, ghost_id=ghost_id)
        return await self.get_ghost(org_id=org_id, school_id=school_id, ghost_id=ghost_id)

    async def _apply_downstream_effects(
        self,
        *,
        org_id: str,
        school_id: str,
        ghost_id: str,
        from_variant_id: str,
        actor_user_id: str,
    ) -> None:
        """When FROM is approved: notify / unlock / attach_output along directed edges."""
        from_node = await self._g.find_variant(ghost_id=ghost_id, variant_id=from_variant_id)
        if from_node is None:
            return
        edges = await self._g.list_edges(ghost_id=ghost_id)
        outgoing = [e for e in edges if str(e["from_variant_id"]) == from_variant_id]
        if not outgoing:
            return

        submission = from_node.get("submission") or {}
        output_refs = list(submission.get("output_refs") or [])
        if not output_refs:
            output_refs = [
                {
                    "fromVariantId": from_variant_id,
                    "name": str(from_node.get("name") or ""),
                    "approvedAt": _utcnow().isoformat(),
                }
            ]

        await self._append_event(
            org_id=org_id,
            school_id=school_id,
            ghost_id=ghost_id,
            event_type="upstream_completed",
            actor_user_id=actor_user_id,
            meta={
                "fromVariantId": from_variant_id,
                "toVariantIds": [str(e["to_variant_id"]) for e in outgoing],
            },
        )

        for edge in outgoing:
            to_id = str(edge["to_variant_id"])
            to_node = await self._g.find_variant(ghost_id=ghost_id, variant_id=to_id)
            if to_node is None:
                continue
            on_complete = list(edge.get("on_complete") or ["notify", "unlock", "attach_output"])

            if "attach_output" in on_complete:
                existing_inputs = [
                    dict(x) for x in (to_node.get("available_inputs") or [])
                    if str(x.get("fromVariantId") or "") != from_variant_id
                ]
                for ref in output_refs:
                    existing_inputs.append(
                        {
                            **dict(ref),
                            "fromVariantId": from_variant_id,
                            "fromName": str(from_node.get("name") or ""),
                        }
                    )
                await self._g.update_variant(
                    ghost_id=ghost_id,
                    variant_id=to_id,
                    patch={"available_inputs": existing_inputs},
                )

            if "notify" in on_complete:
                await self._append_event(
                    org_id=org_id,
                    school_id=school_id,
                    ghost_id=ghost_id,
                    event_type="notified_downstream",
                    actor_user_id=actor_user_id,
                    meta={
                        "fromVariantId": from_variant_id,
                        "toVariantId": to_id,
                        "toName": str(to_node.get("name") or ""),
                        "assigneeUserIds": [
                            str(x) for x in (to_node.get("assignee_user_ids") or [])
                        ],
                        "message": (
                            f"{from_node.get('name') or 'Upstream'} is done — "
                            f"use it for {to_node.get('name') or 'downstream'}."
                        ),
                    },
                )

            # unlock is computed on read via blocked_by; record explicit unlock event
            if "unlock" in on_complete:
                await self._append_event(
                    org_id=org_id,
                    school_id=school_id,
                    ghost_id=ghost_id,
                    event_type="downstream_unlocked",
                    actor_user_id=actor_user_id,
                    meta={"fromVariantId": from_variant_id, "toVariantId": to_id},
                )

    async def submit_node(
        self,
        *,
        org_id: str,
        school_id: str,
        ghost_id: str,
        variant_id: str,
        user_id: str,
        payload: GhostNodeSubmitInput,
    ) -> GhostPublic:
        doc = await self._g.find_instance(org_id=org_id, school_id=school_id, ghost_id=ghost_id)
        if doc is None:
            raise NotFoundError("Ghost not found.", code="ghost_not_found")
        node = await self._g.find_variant(ghost_id=ghost_id, variant_id=variant_id)
        if node is None:
            raise NotFoundError("Chain node not found.", code="ghost_variant_not_found")

        node_docs = await self._g.list_variants(ghost_id=ghost_id)
        edge_docs = await self._g.list_edges(ghost_id=ghost_id)
        blocked = self._blocked_by_map(node_docs=node_docs, edge_docs=edge_docs).get(variant_id, [])
        if blocked:
            raise ValidationError(
                "Node is blocked until upstream chain links are approved.",
                code="ghost_variant_blocked",
            )

        status = str(node.get("status") or "open")
        if status in _APPROVED_STATUSES:
            raise ValidationError("Approved node cannot be re-submitted.", code="ghost_variant_already_approved")
        if status == "submitted":
            raise ValidationError("Node is already submitted.", code="ghost_variant_already_submitted")

        now = _utcnow()
        working = dict(node.get("working_head") or {})
        version = int(working.get("version") or 1) + 1
        working["version"] = version
        working["mode"] = str(node.get("implementation_type") or working.get("mode") or "same_base")
        working["lastSubmittedAt"] = now.isoformat()
        await self._g.update_variant(
            ghost_id=ghost_id,
            variant_id=variant_id,
            patch={
                "status": "submitted",
                "working_head": working,
                "submission": {
                    "note": payload.note.strip(),
                    "output_refs": list(payload.output_refs),
                    "submitted_by_user_id": user_id,
                    "submitted_at": now,
                    "headVersion": version,
                },
            },
        )
        if str(doc.get("status") or "open") == "open":
            await self._g.update_instance(
                org_id=org_id,
                school_id=school_id,
                ghost_id=ghost_id,
                patch={"status": "in_progress"},
            )
        await self._append_event(
            org_id=org_id,
            school_id=school_id,
            ghost_id=ghost_id,
            event_type="submitted",
            actor_user_id=user_id,
            meta={"variantId": variant_id},
        )
        await self._sync_ops_mirror(org_id=org_id, school_id=school_id, ghost_id=ghost_id)
        return await self.get_ghost(org_id=org_id, school_id=school_id, ghost_id=ghost_id)

    async def review_node(
        self,
        *,
        org_id: str,
        school_id: str,
        ghost_id: str,
        variant_id: str,
        user_id: str,
        payload: GhostNodeReviewInput,
    ) -> GhostPublic:
        doc = await self._g.find_instance(org_id=org_id, school_id=school_id, ghost_id=ghost_id)
        if doc is None:
            raise NotFoundError("Ghost not found.", code="ghost_not_found")
        node = await self._g.find_variant(ghost_id=ghost_id, variant_id=variant_id)
        if node is None:
            raise NotFoundError("Chain node not found.", code="ghost_variant_not_found")

        status = str(node.get("status") or "open")
        if payload.decision == "approve":
            if status not in {"submitted", "open", "in_progress", "changes_requested"}:
                # allow approve from submitted primarily; also open for MVP managers
                if status in _APPROVED_STATUSES:
                    raise ValidationError("Node is already approved.", code="ghost_variant_already_approved")
            now = _utcnow()
            await self._g.update_variant(
                ghost_id=ghost_id,
                variant_id=variant_id,
                patch={
                    "status": "approved",
                    "review": {
                        "decision": "approve",
                        "note": payload.note.strip(),
                        "reviewed_by_user_id": user_id,
                        "reviewed_at": now,
                    },
                },
            )
            # Branch Base: merge winning branch head into default/end when forked
            if (
                str(node.get("implementation_type") or "") == "branch_base"
                and node.get("forked_from_variant_id")
            ):
                parent_id = str(node["forked_from_variant_id"])
                parent = await self._g.find_variant(ghost_id=ghost_id, variant_id=parent_id)
                if parent is not None:
                    branch_head = dict(node.get("working_head") or {})
                    merged = {
                        **branch_head,
                        "version": int((parent.get("working_head") or {}).get("version") or 1) + 1,
                        "mode": "same_base",
                        "mergedFromVariantId": variant_id,
                        "mergedAt": now.isoformat(),
                    }
                    await self._g.update_variant(
                        ghost_id=ghost_id,
                        variant_id=parent_id,
                        patch={"working_head": merged},
                    )
                    await self._g.update_variant(
                        ghost_id=ghost_id,
                        variant_id=variant_id,
                        patch={"status": "merged"},
                    )
                    await self._append_event(
                        org_id=org_id,
                        school_id=school_id,
                        ghost_id=ghost_id,
                        event_type="branch_merged",
                        actor_user_id=user_id,
                        meta={"variantId": variant_id, "intoVariantId": parent_id},
                    )

            await self._append_event(
                org_id=org_id,
                school_id=school_id,
                ghost_id=ghost_id,
                event_type="reviewed",
                actor_user_id=user_id,
                meta={"variantId": variant_id, "decision": "approve"},
            )
            await self._apply_downstream_effects(
                org_id=org_id,
                school_id=school_id,
                ghost_id=ghost_id,
                from_variant_id=variant_id,
                actor_user_id=user_id,
            )
            await self._sync_ops_mirror(org_id=org_id, school_id=school_id, ghost_id=ghost_id)
            return await self.get_ghost(org_id=org_id, school_id=school_id, ghost_id=ghost_id)

        if payload.decision == "changes_requested":
            await self._g.update_variant(
                ghost_id=ghost_id,
                variant_id=variant_id,
                patch={
                    "status": "in_progress",
                    "review": {
                        "decision": "changes_requested",
                        "note": payload.note.strip(),
                        "reviewed_by_user_id": user_id,
                        "reviewed_at": _utcnow(),
                    },
                },
            )
            await self._append_event(
                org_id=org_id,
                school_id=school_id,
                ghost_id=ghost_id,
                event_type="reviewed",
                actor_user_id=user_id,
                meta={"variantId": variant_id, "decision": "changes_requested"},
            )
            await self._sync_ops_mirror(org_id=org_id, school_id=school_id, ghost_id=ghost_id)
            return await self.get_ghost(org_id=org_id, school_id=school_id, ghost_id=ghost_id)

        # reject
        await self._g.update_variant(
            ghost_id=ghost_id,
            variant_id=variant_id,
            patch={
                "status": "rejected",
                "review": {
                    "decision": "reject",
                    "note": payload.note.strip(),
                    "reviewed_by_user_id": user_id,
                    "reviewed_at": _utcnow(),
                },
            },
        )
        await self._append_event(
            org_id=org_id,
            school_id=school_id,
            ghost_id=ghost_id,
            event_type="reviewed",
            actor_user_id=user_id,
            meta={"variantId": variant_id, "decision": "reject"},
        )
        await self._sync_ops_mirror(org_id=org_id, school_id=school_id, ghost_id=ghost_id)
        return await self.get_ghost(org_id=org_id, school_id=school_id, ghost_id=ghost_id)

    async def fulfill_ghost(
        self,
        *,
        org_id: str,
        school_id: str,
        ghost_id: str,
        user_id: str,
        payload: GhostFulfillInput,
    ) -> GhostPublic:
        doc = await self._g.find_instance(org_id=org_id, school_id=school_id, ghost_id=ghost_id)
        if doc is None:
            raise NotFoundError("Ghost not found.", code="ghost_not_found")
        node_docs = await self._g.list_variants(ghost_id=ghost_id)
        edge_docs = await self._g.list_edges(ghost_id=ghost_id)
        ok, err, end_node = self._fulfill_ready(
            ghost_doc=doc,
            node_docs=node_docs,
            edge_docs=edge_docs,
            end_variant_id=payload.end_variant_id,
        )
        if not ok or end_node is None:
            raise ValidationError(
                "Ghost cannot be fulfilled yet.",
                code=err or "ghost_fulfill_blocked",
            )

        adapter = self._adapters.resolve(
            host_type=str(doc.get("host_type") or "course"),
            slot_key=str(doc.get("slot_key") or ""),
            resource_kind=str(doc.get("resource_kind") or "document"),
        )
        promoted = await adapter.fulfill(
            org_id=org_id,
            school_id=school_id,
            ghost=doc,
            end_node=end_node,
        )
        await self._g.update_instance(
            org_id=org_id,
            school_id=school_id,
            ghost_id=ghost_id,
            patch={
                "status": "fulfilled",
                "promoted_resource": promoted,
            },
        )
        await self._append_event(
            org_id=org_id,
            school_id=school_id,
            ghost_id=ghost_id,
            event_type="fulfilled",
            actor_user_id=user_id,
            meta={
                "endVariantId": str(end_node["_id"]),
                "promoted": promoted,
            },
        )
        await self._sync_ops_mirror(org_id=org_id, school_id=school_id, ghost_id=ghost_id)
        return await self.get_ghost(org_id=org_id, school_id=school_id, ghost_id=ghost_id)

    async def ensure_ops_table(
        self,
        *,
        org_id: str,
        school_id: str,
        user_id: str,
        host_workspace_item_id: str,
    ) -> dict[str, Any]:
        if self._mt is None:
            raise ValidationError("Management table service unavailable.", code="ghost_ops_mt_unavailable")
        boot = await self._mt.bootstrap_ghost_ops_table_workspace_item(
            org_id=org_id,
            school_id=school_id,
            user_id=user_id,
            workspace_item_id=host_workspace_item_id,
        )
        # Sync all ghosts for this host into the board
        docs, _total = await self._g.list_instances(
            org_id=org_id,
            school_id=school_id,
            host_type=None,
            host_workspace_item_id=host_workspace_item_id,
            status=None,
        )
        for d in docs:
            await self._sync_ops_mirror(
                org_id=org_id, school_id=school_id, ghost_id=str(d["_id"])
            )
        return {
            "instanceId": boot.instance.id,
            "definitionId": boot.definition.id,
            "alreadyLinked": boot.already_linked,
        }

    async def list_my_work(
        self,
        *,
        org_id: str,
        school_id: str,
        user_id: str,
    ) -> GhostMyWorkResponse:
        await self._require_school(org_id=org_id, school_id=school_id)
        variants = await self._g.list_variants_for_assignee(
            org_id=org_id, school_id=school_id, user_id=user_id
        )
        items: list[GhostMyWorkItemPublic] = []
        for v in variants:
            ghost = await self._g.find_instance(
                org_id=org_id, school_id=school_id, ghost_id=str(v["ghost_id"])
            )
            if ghost is None:
                continue
            if str(ghost.get("status")) == "cancelled":
                continue
            node_docs = await self._g.list_variants(ghost_id=str(ghost["_id"]))
            edge_docs = await self._g.list_edges(ghost_id=str(ghost["_id"]))
            blocked = self._blocked_by_map(node_docs=node_docs, edge_docs=edge_docs).get(
                str(v["_id"]), []
            )
            items.append(
                GhostMyWorkItemPublic(
                    ghost_id=str(ghost["_id"]),
                    ghost_title=str(ghost.get("title") or ""),
                    host_type=str(ghost.get("host_type") or "course"),  # type: ignore[arg-type]
                    host_workspace_item_id=str(ghost.get("host_workspace_item_id") or ""),
                    variant_id=str(v["_id"]),
                    variant_name=str(v.get("name") or ""),
                    status=str(v.get("status") or "open"),  # type: ignore[arg-type]
                    blocked=bool(blocked),
                    implementation_type=str(v.get("implementation_type") or "same_base"),  # type: ignore[arg-type]
                    due_at=ghost.get("due_at"),
                )
            )
        return GhostMyWorkResponse(items=items, total=len(items))

    async def list_events(
        self,
        *,
        org_id: str,
        school_id: str,
        ghost_id: str,
    ) -> GhostEventListResponse:
        doc = await self._g.find_instance(org_id=org_id, school_id=school_id, ghost_id=ghost_id)
        if doc is None:
            raise NotFoundError("Ghost not found.", code="ghost_not_found")
        docs, total = await self._g.list_events(ghost_id=ghost_id)
        return GhostEventListResponse(items=[self._map_event(d) for d in docs], total=total)
