"""School service layer."""

from __future__ import annotations

import asyncio
from datetime import UTC, datetime, timedelta

from app.core.config import Settings, get_settings
from app.core.exceptions import NotFoundError, PermissionDeniedError, ValidationError
from app.domain.school.repository import Repository
from app.domain.school.schemas import (
    MarketplaceBidInput,
    MarketplaceBuyInput,
    MarketplaceCreateInput,
    MarketplaceListResponse,
    MarketplaceSortBy,
    MarketplaceSortDirection,
    MarketplaceUpdateInput,
    MarketplaceViewResponse,
    MySchoolMembershipItem,
    MySchoolsResponse,
    OfferCreateInput,
    OfferListView,
    OfferListResponse,
    OfferPublic,
    OfferStatus,
    OfferStatusUpdateInput,
    SchoolArchiveInput,
    SchoolArchiveResponse,
    SchoolCreateInput,
    SchoolUpdateInput,
    SchoolListResponse,
    SchoolPublic,
    ClassSessionCreateInput,
    ClassSessionListResponse,
    ClassSessionPublic,
    ClassSessionUpdateInput,
    ClassEnrollmentCreateInput,
    ClassEnrollmentListResponse,
    ClassEnrollmentPublic,
    ClassEnrollmentUserPublic,
    SchoolMemberSearchPicker,
    SchoolMemberSearchResponse,
    SchoolMemberSearchUserPublic,
    SchoolWorkspaceCreateInput,
    SchoolWorkspaceItemPublic,
    SchoolWorkspaceListResponse,
    SchoolWorkspaceUpdateInput,
)


class Service:
    """Business logic for school, marketplace, and offer management."""
    _bootstrap_lock = asyncio.Lock()
    _bootstrapped = False

    def __init__(self, repository: Repository, settings: Settings | None = None) -> None:
        self._repository = repository
        self._settings = settings or get_settings()

    async def bootstrap(self) -> None:
        if Service._bootstrapped:
            return
        async with Service._bootstrap_lock:
            if Service._bootstrapped:
                return
            await self._repository.ensure_indexes()
            Service._bootstrapped = True

    async def healthcheck(self) -> bool:
        return await self._repository.ping()

    async def list_schools(self, *, org_id: str, archived: bool) -> SchoolListResponse:
        docs = await self._repository.list_schools(org_id=org_id, archived=archived)
        return SchoolListResponse(items=[_map_school(doc) for doc in docs])

    async def get_school(self, *, org_id: str, school_id: str) -> SchoolPublic:
        doc = await self._repository.find_school(org_id=org_id, school_id=school_id)
        if doc is None:
            raise NotFoundError("School not found.", code="school_not_found")
        return _map_school(doc)

    async def update_school(
        self,
        *,
        org_id: str,
        school_id: str,
        payload: SchoolUpdateInput,
    ) -> SchoolPublic:
        existing = await self._repository.find_school(org_id=org_id, school_id=school_id)
        if existing is None:
            raise NotFoundError("School not found.", code="school_not_found")
        _validate_school_create_payload(payload)
        updates: dict[str, object] = {
            "name": payload.name.strip(),
            "school_type": payload.school_type.strip(),
            "email": payload.email.strip() if isinstance(payload.email, str) and payload.email.strip() else None,
            "logo_url": payload.logo_url.strip() if isinstance(payload.logo_url, str) and payload.logo_url.strip() else None,
            "custom_fields": [field.model_dump() for field in payload.custom_fields],
            "partners": [partner.model_dump() for partner in payload.partners],
            "documents": [document.model_dump() for document in payload.documents],
        }
        ok = await self._repository.update_school(org_id=org_id, school_id=school_id, updates=updates)
        if not ok:
            raise NotFoundError("School not found.", code="school_not_found")
        refreshed = await self._repository.find_school(org_id=org_id, school_id=school_id)
        if refreshed is None:
            raise NotFoundError("School not found.", code="school_not_found")
        return _map_school(refreshed)

    async def create_school(
        self,
        *,
        org_id: str,
        user_id: str,
        user_email: str | None,
        payload: SchoolCreateInput,
    ) -> SchoolPublic:
        _validate_school_create_payload(payload, sender_email=user_email)
        sender_email = user_email.strip().lower() if isinstance(user_email, str) and user_email.strip() else None
        recipient_partners = [
            partner
            for partner in payload.partners
            if partner.email
            and partner.email.strip()
            and (sender_email is None or partner.email.strip().lower() != sender_email)
        ]
        onboarding_status = (
            "pending_partner_acceptance" if len(recipient_partners) > 0 else "active"
        )
        doc = await self._repository.create_school(
            org_id=org_id,
            user_id=user_id,
            name=payload.name,
            school_type=payload.school_type,
            email=payload.email,
            logo_url=payload.logo_url,
            custom_fields=[field.model_dump() for field in payload.custom_fields],
            onboarding_status=onboarding_status,
            partners=[partner.model_dump() for partner in payload.partners],
            documents=[document.model_dump() for document in payload.documents],
        )
        await self._repository.upsert_school_membership(
            user_id=user_id,
            school_id=str(doc["_id"]),
            org_id=org_id,
            role_keys=["school_owner"],
        )
        await self._repository.ensure_school_workspace_root(
            org_id=org_id,
            school_id=str(doc["_id"]),
        )
        school_id = str(doc["_id"])
        school_name = payload.name.strip()
        for partner in recipient_partners:
            await self._repository.create_offer(
                org_id=org_id,
                school_id=school_id,
                school_name=school_name,
                sender_user_id=user_id,
                sender_email=sender_email,
                recipient_email=partner.email.strip().lower() if partner.email else None,
                party_full_name=partner.full_name.strip(),
                party_email=(partner.email.strip() if partner.email else None),
                ownership_percentage=partner.ownership_percentage,
                share_accesses=[access.model_dump() for access in partner.share_accesses],
                offer_kind="ownership",
            )
        return _map_school(doc)

    async def list_school_workspace_items(
        self,
        *,
        org_id: str,
        school_id: str,
        item_type: str | None = None,
        parent_item_id: str | None = None,
    ) -> SchoolWorkspaceListResponse:
        school = await self._repository.find_school(org_id=org_id, school_id=school_id)
        if school is None:
            raise NotFoundError("School not found.", code="school_not_found")
        root = await self._repository.ensure_school_workspace_root(org_id=org_id, school_id=school_id)
        root_id = str(root["_id"])
        list_parent_id = root_id
        if isinstance(parent_item_id, str) and parent_item_id.strip():
            raw = parent_item_id.strip()
            parent_doc = await self._repository.find_school_workspace_item(
                org_id=org_id,
                school_id=school_id,
                item_id=raw,
            )
            if parent_doc is None:
                raise NotFoundError("Parent workspace folder not found.", code="workspace_parent_not_found")
            list_parent_id = raw
        docs = await self._repository.list_school_workspace_items(
            org_id=org_id,
            school_id=school_id,
            item_type=item_type,
            parent_id=list_parent_id,
        )
        return SchoolWorkspaceListResponse(items=[_map_workspace_item(doc) for doc in docs])

    async def get_school_workspace_item(
        self,
        *,
        org_id: str,
        school_id: str,
        item_id: str,
    ) -> SchoolWorkspaceItemPublic:
        school = await self._repository.find_school(org_id=org_id, school_id=school_id)
        if school is None:
            raise NotFoundError("School not found.", code="school_not_found")
        doc = await self._repository.find_school_workspace_item(
            org_id=org_id,
            school_id=school_id,
            item_id=item_id,
        )
        if doc is None:
            raise NotFoundError("Workspace item not found.", code="workspace_item_not_found")
        return _map_workspace_item(doc)

    async def create_school_workspace_item(
        self,
        *,
        org_id: str,
        school_id: str,
        payload: SchoolWorkspaceCreateInput,
    ) -> SchoolWorkspaceItemPublic:
        school = await self._repository.find_school(org_id=org_id, school_id=school_id)
        if school is None:
            raise NotFoundError("School not found.", code="school_not_found")
        root = await self._repository.ensure_school_workspace_root(org_id=org_id, school_id=school_id)
        root_id = str(root["_id"])
        target_parent_id = root_id
        raw_parent = payload.parent_id
        if isinstance(raw_parent, str) and raw_parent.strip():
            pid = raw_parent.strip()
            parent_doc = await self._repository.find_school_workspace_item(
                org_id=org_id,
                school_id=school_id,
                item_id=pid,
            )
            if parent_doc is None:
                raise NotFoundError("Parent workspace folder not found.", code="workspace_parent_not_found")
            if bool(parent_doc.get("is_root")):
                target_parent_id = str(parent_doc["_id"])
            else:
                ptype = str(parent_doc.get("type", ""))
                if ptype not in ("department", "folder"):
                    raise ValidationError(
                        "Items can only be created under the root department or under a department or folder.",
                        code="workspace_parent_invalid_type",
                    )
                target_parent_id = pid
        metadata = payload.metadata if isinstance(payload.metadata, dict) else {}
        doc = await self._repository.create_school_workspace_item(
            org_id=org_id,
            school_id=school_id,
            item_type=payload.type,
            title=payload.title,
            description=payload.description,
            metadata=metadata,
            parent_id=target_parent_id,
        )
        return _map_workspace_item(doc)

    async def update_school_workspace_item(
        self,
        *,
        org_id: str,
        school_id: str,
        item_id: str,
        payload: SchoolWorkspaceUpdateInput,
    ) -> SchoolWorkspaceItemPublic:
        school = await self._repository.find_school(org_id=org_id, school_id=school_id)
        if school is None:
            raise NotFoundError("School not found.", code="school_not_found")
        existing = await self._repository.find_school_workspace_item(
            org_id=org_id,
            school_id=school_id,
            item_id=item_id,
        )
        if existing is None:
            raise NotFoundError("Workspace item not found.", code="workspace_item_not_found")
        if bool(existing.get("is_root", False)):
            raise ValidationError("Root workspace item cannot be edited.", code="workspace_item_root_immutable")
        updates: dict[str, object] = {}
        if payload.title is not None:
            updates["title"] = payload.title.strip()
        if payload.description is not None:
            updates["description"] = payload.description.strip() if payload.description.strip() else None
        if payload.metadata is not None:
            updates["metadata"] = payload.metadata if isinstance(payload.metadata, dict) else {}
        if len(updates) == 0:
            raise ValidationError("No changes were provided.", code="workspace_item_update_empty")
        ok = await self._repository.update_school_workspace_item(
            org_id=org_id,
            school_id=school_id,
            item_id=item_id,
            updates=updates,
        )
        if not ok:
            raise NotFoundError("Workspace item not found.", code="workspace_item_not_found")
        refreshed = await self._repository.find_school_workspace_item(
            org_id=org_id,
            school_id=school_id,
            item_id=item_id,
        )
        if refreshed is None:
            raise NotFoundError("Workspace item not found.", code="workspace_item_not_found")
        return _map_workspace_item(refreshed)

    async def delete_school_workspace_item(
        self,
        *,
        org_id: str,
        school_id: str,
        item_id: str,
    ) -> None:
        school = await self._repository.find_school(org_id=org_id, school_id=school_id)
        if school is None:
            raise NotFoundError("School not found.", code="school_not_found")
        existing = await self._repository.find_school_workspace_item(
            org_id=org_id,
            school_id=school_id,
            item_id=item_id,
        )
        if existing is None:
            raise NotFoundError("Workspace item not found.", code="workspace_item_not_found")
        if bool(existing.get("is_root", False)):
            raise ValidationError("Root workspace item cannot be deleted.", code="workspace_item_root_immutable")
        child_count = await self._repository.count_school_workspace_children(
            org_id=org_id,
            school_id=school_id,
            parent_id=item_id,
        )
        if child_count > 0:
            raise ValidationError(
                "This workspace folder still contains items. Move or delete them first.",
                code="workspace_item_has_children",
            )
        ok = await self._repository.delete_school_workspace_item(
            org_id=org_id,
            school_id=school_id,
            item_id=item_id,
        )
        if not ok:
            raise NotFoundError("Workspace item not found.", code="workspace_item_not_found")

    async def list_class_sessions(
        self,
        *,
        org_id: str,
        school_id: str,
        class_workspace_item_id: str,
    ) -> ClassSessionListResponse:
        await self._require_class_workspace_item(
            org_id=org_id,
            school_id=school_id,
            class_item_id=class_workspace_item_id,
        )
        docs = await self._repository.list_class_sessions(
            org_id=org_id,
            school_id=school_id,
            class_workspace_item_id=class_workspace_item_id,
        )
        return ClassSessionListResponse(items=[_map_class_session(doc) for doc in docs])

    async def create_class_session(
        self,
        *,
        org_id: str,
        school_id: str,
        class_workspace_item_id: str,
        payload: ClassSessionCreateInput,
    ) -> ClassSessionPublic:
        await self._require_class_workspace_item(
            org_id=org_id,
            school_id=school_id,
            class_item_id=class_workspace_item_id,
        )
        status = "scheduled" if payload.scheduled_at is not None else "draft"
        doc = await self._repository.create_class_session(
            org_id=org_id,
            school_id=school_id,
            class_workspace_item_id=class_workspace_item_id,
            title=payload.title,
            description=payload.description,
            weight=payload.weight,
            duration_minutes=payload.duration_minutes,
            session_type=payload.session_type,
            scheduled_at=payload.scheduled_at,
            creation_mode=payload.creation_mode or "single",
            status=status,
        )
        return _map_class_session(doc)

    async def update_class_session(
        self,
        *,
        org_id: str,
        school_id: str,
        class_workspace_item_id: str,
        session_id: str,
        payload: ClassSessionUpdateInput,
    ) -> ClassSessionPublic:
        await self._require_class_workspace_item(
            org_id=org_id,
            school_id=school_id,
            class_item_id=class_workspace_item_id,
        )
        existing = await self._repository.find_class_session(
            org_id=org_id,
            school_id=school_id,
            session_id=session_id,
        )
        if existing is None:
            raise NotFoundError("Class session not found.", code="class_session_not_found")
        if str(existing.get("class_workspace_item_id", "")) != class_workspace_item_id:
            raise NotFoundError("Class session not found.", code="class_session_not_found")
        updates: dict[str, object] = {}
        if payload.title is not None:
            updates["title"] = payload.title.strip()
        if payload.description is not None:
            updates["description"] = payload.description.strip() if payload.description.strip() else None
        if payload.weight is not None:
            updates["weight"] = payload.weight
        if payload.duration_minutes is not None:
            updates["duration_minutes"] = payload.duration_minutes
        if payload.session_type is not None:
            updates["session_type"] = payload.session_type
        if payload.scheduled_at is not None:
            updates["scheduled_at"] = payload.scheduled_at
        if payload.status is not None:
            updates["status"] = payload.status
        if len(updates) == 0:
            raise ValidationError("No changes were provided.", code="class_session_update_empty")
        ok = await self._repository.update_class_session(
            org_id=org_id,
            school_id=school_id,
            session_id=session_id,
            updates=updates,
        )
        if not ok:
            raise NotFoundError("Class session not found.", code="class_session_not_found")
        refreshed = await self._repository.find_class_session(
            org_id=org_id,
            school_id=school_id,
            session_id=session_id,
        )
        if refreshed is None:
            raise NotFoundError("Class session not found.", code="class_session_not_found")
        return _map_class_session(refreshed)

    async def delete_class_session(
        self,
        *,
        org_id: str,
        school_id: str,
        class_workspace_item_id: str,
        session_id: str,
    ) -> None:
        await self._require_class_workspace_item(
            org_id=org_id,
            school_id=school_id,
            class_item_id=class_workspace_item_id,
        )
        existing = await self._repository.find_class_session(
            org_id=org_id,
            school_id=school_id,
            session_id=session_id,
        )
        if existing is None or str(existing.get("class_workspace_item_id", "")) != class_workspace_item_id:
            raise NotFoundError("Class session not found.", code="class_session_not_found")
        ok = await self._repository.delete_class_session(
            org_id=org_id,
            school_id=school_id,
            session_id=session_id,
        )
        if not ok:
            raise NotFoundError("Class session not found.", code="class_session_not_found")

    async def list_class_enrollments(
        self,
        *,
        org_id: str,
        school_id: str,
        class_workspace_item_id: str,
    ) -> ClassEnrollmentListResponse:
        await self._require_class_workspace_item(
            org_id=org_id,
            school_id=school_id,
            class_item_id=class_workspace_item_id,
        )
        docs = await self._repository.list_class_enrollments(
            org_id=org_id,
            school_id=school_id,
            class_workspace_item_id=class_workspace_item_id,
            status="active",
        )
        items: list[ClassEnrollmentPublic] = []
        for doc in docs:
            mapped = await self._map_class_enrollment(doc)
            if mapped is not None:
                items.append(mapped)
        return ClassEnrollmentListResponse(items=items)

    async def search_school_members(
        self,
        *,
        org_id: str,
        school_id: str,
        q: str,
        limit: int = 20,
        picker: SchoolMemberSearchPicker = "school_students",
        class_workspace_item_id: str | None = None,
    ) -> SchoolMemberSearchResponse:
        school = await self._repository.find_school(org_id=org_id, school_id=school_id)
        if school is None:
            raise NotFoundError("School not found.", code="school_not_found")
        if picker == "class_students":
            class_id = (class_workspace_item_id or "").strip()
            if not class_id:
                raise ValidationError(
                    "classWorkspaceItemId is required when picker is class_students.",
                    code="class_students_picker_missing_class",
                )
            docs = await self._repository.search_class_students_for_picker(
                org_id=org_id,
                school_id=school_id,
                class_workspace_item_id=class_id,
                q=q,
                limit=limit,
            )
        else:
            docs = await self._repository.search_users_for_school_picker(
                school_id=school_id,
                q=q,
                limit=limit,
                picker=picker,
            )
        items: list[SchoolMemberSearchUserPublic] = []
        for doc in docs:
            items.append(
                SchoolMemberSearchUserPublic(
                    user_id=str(doc["_id"]),
                    username=(str(doc["username"]) if doc.get("username") is not None else None),
                    email=(str(doc["email"]) if doc.get("email") is not None else None),
                    full_name=(str(doc["full_name"]) if doc.get("full_name") is not None else None),
                )
            )
        return SchoolMemberSearchResponse(items=items)

    async def enroll_student_in_class(
        self,
        *,
        org_id: str,
        school_id: str,
        class_workspace_item_id: str,
        payload: ClassEnrollmentCreateInput,
        enrolled_by_user_id: str | None,
    ) -> ClassEnrollmentPublic:
        await self._require_class_workspace_item(
            org_id=org_id,
            school_id=school_id,
            class_item_id=class_workspace_item_id,
        )
        user_id = (payload.user_id or "").strip()
        email = (payload.email or "").strip().lower()
        if not user_id and not email:
            raise ValidationError(
                "Provide userId or email to enroll a student.",
                code="class_enrollment_identity_required",
            )
        user_doc: dict[str, object] | None
        if user_id:
            user_doc = await self._repository.find_user_profile(user_id=user_id)
        else:
            user_doc = await self._repository.find_user_by_email_normalized(
                email_normalized=email,
            )
            user_id = str(user_doc["_id"]) if user_doc is not None else ""
        if user_doc is None or not user_id:
            raise NotFoundError("User not found.", code="user_not_found")

        existing = await self._repository.find_class_enrollment_for_user(
            org_id=org_id,
            school_id=school_id,
            class_workspace_item_id=class_workspace_item_id,
            user_id=user_id,
        )
        if existing is not None and str(existing.get("status", "")) == "active":
            raise ValidationError(
                "This student is already enrolled in the class.",
                code="class_enrollment_exists",
            )

        membership = await self._repository.find_school_membership(
            user_id=user_id,
            school_id=school_id,
        )
        role_keys = list(membership.get("role_keys", [])) if membership is not None else []
        if "student" not in role_keys:
            role_keys.append("student")
        await self._repository.upsert_school_membership(
            user_id=user_id,
            school_id=school_id,
            org_id=org_id,
            role_keys=role_keys,
        )

        if existing is not None:
            ok = await self._repository.update_class_enrollment(
                org_id=org_id,
                school_id=school_id,
                enrollment_id=str(existing["_id"]),
                updates={
                    "status": "active",
                    "role": "student",
                    "enrolled_by_user_id": enrolled_by_user_id,
                    "enrolled_at": datetime.now(UTC),
                },
            )
            if not ok:
                raise NotFoundError("Enrollment not found.", code="class_enrollment_not_found")
            refreshed = await self._repository.find_class_enrollment(
                org_id=org_id,
                school_id=school_id,
                enrollment_id=str(existing["_id"]),
            )
        else:
            refreshed = await self._repository.create_class_enrollment(
                org_id=org_id,
                school_id=school_id,
                class_workspace_item_id=class_workspace_item_id,
                user_id=user_id,
                role="student",
                status="active",
                enrolled_by_user_id=enrolled_by_user_id,
            )

        if refreshed is None:
            raise NotFoundError("Enrollment not found.", code="class_enrollment_not_found")

        await self._sync_class_student_count(
            org_id=org_id,
            school_id=school_id,
            class_workspace_item_id=class_workspace_item_id,
        )

        mapped = await self._map_class_enrollment(refreshed)
        if mapped is None:
            raise NotFoundError("User not found.", code="user_not_found")
        return mapped

    async def withdraw_class_enrollment(
        self,
        *,
        org_id: str,
        school_id: str,
        class_workspace_item_id: str,
        enrollment_id: str,
    ) -> None:
        await self._require_class_workspace_item(
            org_id=org_id,
            school_id=school_id,
            class_item_id=class_workspace_item_id,
        )
        existing = await self._repository.find_class_enrollment(
            org_id=org_id,
            school_id=school_id,
            enrollment_id=enrollment_id,
        )
        if existing is None:
            raise NotFoundError("Enrollment not found.", code="class_enrollment_not_found")
        if str(existing.get("class_workspace_item_id", "")) != class_workspace_item_id:
            raise NotFoundError("Enrollment not found.", code="class_enrollment_not_found")
        ok = await self._repository.update_class_enrollment(
            org_id=org_id,
            school_id=school_id,
            enrollment_id=enrollment_id,
            updates={"status": "withdrawn"},
        )
        if not ok:
            raise NotFoundError("Enrollment not found.", code="class_enrollment_not_found")
        await self._sync_class_student_count(
            org_id=org_id,
            school_id=school_id,
            class_workspace_item_id=class_workspace_item_id,
        )

    async def _sync_class_student_count(
        self,
        *,
        org_id: str,
        school_id: str,
        class_workspace_item_id: str,
    ) -> None:
        count = await self._repository.count_active_class_enrollments(
            org_id=org_id,
            school_id=school_id,
            class_workspace_item_id=class_workspace_item_id,
        )
        item = await self._repository.find_school_workspace_item(
            org_id=org_id,
            school_id=school_id,
            item_id=class_workspace_item_id,
        )
        if item is None:
            return
        metadata = item.get("metadata")
        metadata_safe = dict(metadata) if isinstance(metadata, dict) else {}
        metadata_safe["studentCount"] = str(count)
        await self._repository.update_school_workspace_item(
            org_id=org_id,
            school_id=school_id,
            item_id=class_workspace_item_id,
            updates={"metadata": metadata_safe},
        )

    async def _map_class_enrollment(self, doc: dict[str, object]) -> ClassEnrollmentPublic | None:
        user_id = str(doc.get("user_id", ""))
        user_doc = await self._repository.find_user_profile(user_id=user_id)
        if user_doc is None:
            return None
        return _map_class_enrollment(doc, user_doc)

    async def _require_class_workspace_item(
        self,
        *,
        org_id: str,
        school_id: str,
        class_item_id: str,
    ) -> dict[str, object]:
        school = await self._repository.find_school(org_id=org_id, school_id=school_id)
        if school is None:
            raise NotFoundError("School not found.", code="school_not_found")
        doc = await self._repository.find_school_workspace_item(
            org_id=org_id,
            school_id=school_id,
            item_id=class_item_id,
        )
        if doc is None:
            raise NotFoundError("Workspace item not found.", code="workspace_item_not_found")
        if str(doc.get("type", "")) != "class":
            raise ValidationError(
                "Sessions can only be managed for a workspace class item.",
                code="class_session_parent_not_class",
            )
        return doc

    async def list_my_schools(self, *, user_id: str) -> MySchoolsResponse:
        """School-scoped view: memberships plus backfill for legacy creator rows."""
        created = await self._repository.list_schools_created_by_user(user_id=user_id)
        for doc in created:
            await self._repository.upsert_school_membership(
                user_id=user_id,
                school_id=str(doc["_id"]),
                org_id=str(doc["org_id"]),
                role_keys=["school_owner"],
            )
        mems = await self._repository.list_school_memberships_for_user(user_id=user_id)
        items: list[MySchoolMembershipItem] = []
        for m in mems:
            school = await self._repository.find_school_by_id(str(m["school_id"]))
            if school is None:
                continue
            items.append(
                MySchoolMembershipItem(
                    school_id=str(school["_id"]),
                    org_id=str(school["org_id"]),
                    name=str(school["name"]),
                    slug=str(school["slug"]),
                    school_type=str(school["school_type"]),
                    archived=bool(school.get("archived", False)),
                    role_keys=[str(k) for k in m.get("role_keys", [])],
                )
            )
        items.sort(key=lambda row: row.name.lower())
        return MySchoolsResponse(items=items)

    async def archive_school(
        self,
        *,
        org_id: str,
        school_id: str,
        payload: SchoolArchiveInput,
    ) -> SchoolArchiveResponse:
        updated = await self._repository.set_school_archived(
            org_id=org_id,
            school_id=school_id,
            archived=payload.archived,
        )
        if not updated:
            raise NotFoundError("School not found.", code="school_not_found")
        return SchoolArchiveResponse(archived=payload.archived)

    async def list_marketplace(
        self,
        *,
        org_id: str,
        user_id: str,
        view: str,
        query_text: str | None = None,
        status: str | None = None,
        school_type: str | None = None,
        min_price: float | None = None,
        max_price: float | None = None,
        sort_by: MarketplaceSortBy = "created_at",
        sort_direction: MarketplaceSortDirection = "desc",
        page: int = 1,
        page_size: int = 20,
    ) -> MarketplaceListResponse:
        docs, total = await self._repository.list_marketplace_items(
            org_id=org_id,
            user_id=user_id,
            view=view,
            query_text=query_text,
            status=status,
            school_type=school_type,
            min_price=min_price,
            max_price=max_price,
            sort_by=sort_by,
            sort_direction=sort_direction,
            page=page,
            page_size=page_size,
        )
        return MarketplaceListResponse(
            items=[_map_marketplace_item(doc) for doc in docs],
            total=total,
            page=max(1, page),
            page_size=max(1, min(100, page_size)),
        )

    async def get_marketplace_item(
        self,
        *,
        org_id: str,
        listing_id: str,
    ) -> MarketplaceViewResponse:
        doc = await self._repository.find_marketplace_item(org_id=org_id, listing_id=listing_id)
        if doc is None:
            raise NotFoundError("Listing not found.", code="listing_not_found")
        return _map_marketplace_item(doc)

    async def list_marketplace_global(
        self,
        *,
        user_id: str,
        view: str = "community",
        query_text: str | None = None,
        status: str | None = None,
        school_type: str | None = None,
        min_price: float | None = None,
        max_price: float | None = None,
        sort_by: MarketplaceSortBy = "created_at",
        sort_direction: MarketplaceSortDirection = "desc",
        page: int = 1,
        page_size: int = 20,
    ) -> MarketplaceListResponse:
        docs, total = await self._repository.list_marketplace_items_global(
            user_id=user_id,
            view=view,
            query_text=query_text,
            status=status,
            school_type=school_type,
            min_price=min_price,
            max_price=max_price,
            sort_by=sort_by,
            sort_direction=sort_direction,
            page=page,
            page_size=page_size,
        )
        return MarketplaceListResponse(
            items=[_map_marketplace_item(doc) for doc in docs],
            total=total,
            page=max(1, page),
            page_size=max(1, min(100, page_size)),
        )

    async def get_marketplace_item_global(self, *, listing_id: str) -> MarketplaceViewResponse:
        doc = await self._repository.find_marketplace_item_by_id(listing_id=listing_id)
        if doc is None:
            raise NotFoundError("Listing not found.", code="listing_not_found")
        return _map_marketplace_item(doc)

    async def update_marketplace_item_global(
        self,
        *,
        listing_id: str,
        user_id: str,
        payload: MarketplaceUpdateInput,
    ) -> MarketplaceViewResponse:
        listing = await self._repository.find_marketplace_item_by_id(listing_id=listing_id)
        if listing is None:
            raise NotFoundError("Listing not found.", code="listing_not_found")
        org_id = str(listing.get("org_id", "")).strip()
        if not org_id:
            raise ValidationError("Listing organization is missing.", code="marketplace_listing_org_missing")
        return await self.update_marketplace_item(
            org_id=org_id,
            listing_id=listing_id,
            user_id=user_id,
            payload=payload,
        )

    async def withdraw_marketplace_item_global(
        self,
        *,
        listing_id: str,
        user_id: str,
    ) -> MarketplaceViewResponse:
        listing = await self._repository.find_marketplace_item_by_id(listing_id=listing_id)
        if listing is None:
            raise NotFoundError("Listing not found.", code="listing_not_found")
        org_id = str(listing.get("org_id", "")).strip()
        if not org_id:
            raise ValidationError("Listing organization is missing.", code="marketplace_listing_org_missing")
        return await self.withdraw_marketplace_item(
            org_id=org_id,
            listing_id=listing_id,
            user_id=user_id,
        )

    async def delete_marketplace_item_global(
        self,
        *,
        listing_id: str,
        user_id: str,
    ) -> None:
        listing = await self._repository.find_marketplace_item_by_id(listing_id=listing_id)
        if listing is None:
            raise NotFoundError("Listing not found.", code="listing_not_found")
        org_id = str(listing.get("org_id", "")).strip()
        if not org_id:
            raise ValidationError("Listing organization is missing.", code="marketplace_listing_org_missing")
        await self.delete_marketplace_item(
            org_id=org_id,
            listing_id=listing_id,
            user_id=user_id,
        )

    async def buy_marketplace_item_global(
        self,
        *,
        buyer_user_id: str,
        buyer_email: str | None,
        payload: MarketplaceBuyInput,
    ) -> OfferPublic:
        listing = await self._repository.find_marketplace_item_by_id(listing_id=payload.listing_id)
        if listing is None:
            raise NotFoundError("Listing not found.", code="listing_not_found")
        org_id = str(listing.get("org_id", "")).strip()
        if not org_id:
            raise ValidationError("Listing organization is missing.", code="marketplace_listing_org_missing")
        return await self.buy_marketplace_item(
            org_id=org_id,
            buyer_user_id=buyer_user_id,
            buyer_email=buyer_email,
            payload=payload,
        )

    async def bid_marketplace_item_global(
        self,
        *,
        buyer_user_id: str,
        buyer_email: str | None,
        payload: MarketplaceBidInput,
    ) -> OfferPublic:
        listing = await self._repository.find_marketplace_item_by_id(listing_id=payload.listing_id)
        if listing is None:
            raise NotFoundError("Listing not found.", code="listing_not_found")
        org_id = str(listing.get("org_id", "")).strip()
        if not org_id:
            raise ValidationError("Listing organization is missing.", code="marketplace_listing_org_missing")
        return await self.bid_marketplace_item(
            org_id=org_id,
            buyer_user_id=buyer_user_id,
            buyer_email=buyer_email,
            payload=payload,
        )

    async def withdraw_marketplace_bid_global(
        self,
        *,
        offer_id: str,
        user_id: str,
    ) -> OfferPublic:
        offer = await self._repository.find_offer_by_id(offer_id=offer_id)
        if offer is None:
            raise NotFoundError("Offer not found.", code="offer_not_found")
        if str(offer.get("offer_kind", "")) != "marketplace_transfer":
            raise ValidationError("Only marketplace bids can be withdrawn.", code="marketplace_withdraw_invalid_kind")
        sender_user_id = str(offer.get("sender_user_id", "")).strip()
        if not sender_user_id or sender_user_id != user_id:
            raise PermissionDeniedError(
                "Only the bidder who submitted this bid can withdraw it.",
                code="marketplace_withdraw_forbidden",
            )
        current_status = str(offer.get("status", "requested"))
        if current_status not in {"requested", "amendment"}:
            raise ValidationError(
                "Only active bids can be withdrawn.",
                code="marketplace_withdraw_invalid_status",
            )
        org_id = str(offer.get("org_id", "")).strip()
        listing_id = str(offer.get("listing_id", "")).strip()
        if not org_id or not listing_id:
            raise ValidationError("Bid is missing listing context.", code="marketplace_withdraw_invalid_payload")
        updated = await self._repository.update_offer_status(
            org_id=org_id,
            offer_id=offer_id,
            status="rejected",
            amendment_data={"note": "withdrawn_by_bidder"},
        )
        if not updated:
            raise NotFoundError("Offer not found.", code="offer_not_found")
        listing = await self._repository.find_marketplace_item(org_id=org_id, listing_id=listing_id)
        listing_bidder = str(listing.get("bidder_user_id", "")).strip() if isinstance(listing, dict) else ""
        if listing_bidder == user_id:
            await self._repository.set_marketplace_status(
                org_id=org_id,
                listing_id=listing_id,
                status="active",
                bidder_user_id="",
            )
        updated_offer = await self._repository.find_offer(org_id=org_id, offer_id=offer_id)
        if updated_offer is None:
            raise NotFoundError("Offer not found.", code="offer_not_found")
        return _map_offer(updated_offer)

    async def list_marketplace_listing_offers(
        self,
        *,
        org_id: str,
        listing_id: str,
        user_id: str,
    ) -> OfferListResponse:
        listing = await self._repository.find_marketplace_item(org_id=org_id, listing_id=listing_id)
        if listing is None:
            raise NotFoundError("Listing not found.", code="listing_not_found")
        owner_user_id = str(listing.get("owner_user_id", "")).strip()
        if not owner_user_id or owner_user_id != user_id:
            raise PermissionDeniedError(
                "Only listing creator can view listing deal room.",
                code="marketplace_listing_offers_forbidden",
            )
        docs = await self._repository.list_marketplace_offers_for_listing(org_id=org_id, listing_id=listing_id)
        return OfferListResponse(items=[_map_offer(doc) for doc in docs])

    async def create_marketplace_item(
        self,
        *,
        org_id: str,
        user_id: str,
        payload: MarketplaceCreateInput,
    ) -> MarketplaceViewResponse:
        school = await self._repository.find_school(org_id=org_id, school_id=payload.school_id)
        if school is None:
            raise NotFoundError("School not found.", code="school_not_found")
        doc = await self._repository.create_marketplace_item(
            org_id=org_id,
            school_id=payload.school_id,
            school_name=str(school["name"]),
            owner_user_id=user_id,
            title=payload.title,
            description=payload.description,
            price=payload.price,
            currency=payload.currency,
        )
        return _map_marketplace_item(doc)

    async def update_marketplace_item(
        self,
        *,
        org_id: str,
        listing_id: str,
        user_id: str,
        payload: MarketplaceUpdateInput,
    ) -> MarketplaceViewResponse:
        listing = await self._repository.find_marketplace_item(org_id=org_id, listing_id=listing_id)
        if listing is None:
            raise NotFoundError("Listing not found.", code="listing_not_found")
        owner_user_id = str(listing.get("owner_user_id", "")).strip()
        if not owner_user_id or owner_user_id != user_id:
            raise PermissionDeniedError("Only listing creator can update this listing.", code="marketplace_listing_update_forbidden")
        status = str(listing.get("status", "active"))
        if status in {"sold", "withdrawn"}:
            raise ValidationError("Only active listings can be updated.", code="marketplace_listing_update_invalid_status")
        updates: dict[str, object] = {}
        if payload.title is not None:
            updates["title"] = payload.title.strip()
        if payload.description is not None:
            updates["description"] = payload.description.strip()
        if payload.price is not None:
            updates["price"] = float(payload.price)
        if payload.currency is not None:
            updates["currency"] = payload.currency.strip().upper()
        if len(updates) == 0:
            raise ValidationError("No listing changes were provided.", code="marketplace_listing_update_empty")
        ok = await self._repository.update_marketplace_item(org_id=org_id, listing_id=listing_id, updates=updates)
        if not ok:
            raise NotFoundError("Listing not found.", code="listing_not_found")
        refreshed = await self._repository.find_marketplace_item(org_id=org_id, listing_id=listing_id)
        if refreshed is None:
            raise NotFoundError("Listing not found.", code="listing_not_found")
        return _map_marketplace_item(refreshed)

    async def withdraw_marketplace_item(
        self,
        *,
        org_id: str,
        listing_id: str,
        user_id: str,
    ) -> MarketplaceViewResponse:
        listing = await self._repository.find_marketplace_item(org_id=org_id, listing_id=listing_id)
        if listing is None:
            raise NotFoundError("Listing not found.", code="listing_not_found")
        owner_user_id = str(listing.get("owner_user_id", "")).strip()
        if not owner_user_id or owner_user_id != user_id:
            raise PermissionDeniedError("Only listing creator can withdraw this listing.", code="marketplace_listing_withdraw_forbidden")
        status = str(listing.get("status", "active"))
        if status == "sold":
            raise ValidationError("Sold listings cannot be withdrawn.", code="marketplace_listing_withdraw_sold")
        if status == "withdrawn":
            return _map_marketplace_item(listing)
        ok = await self._repository.set_marketplace_status(
            org_id=org_id,
            listing_id=listing_id,
            status="withdrawn",
            bidder_user_id="",
        )
        if not ok:
            raise NotFoundError("Listing not found.", code="listing_not_found")
        refreshed = await self._repository.find_marketplace_item(org_id=org_id, listing_id=listing_id)
        if refreshed is None:
            raise NotFoundError("Listing not found.", code="listing_not_found")
        return _map_marketplace_item(refreshed)

    async def delete_marketplace_item(
        self,
        *,
        org_id: str,
        listing_id: str,
        user_id: str,
    ) -> None:
        listing = await self._repository.find_marketplace_item(org_id=org_id, listing_id=listing_id)
        if listing is None:
            raise NotFoundError("Listing not found.", code="listing_not_found")
        owner_user_id = str(listing.get("owner_user_id", "")).strip()
        if not owner_user_id or owner_user_id != user_id:
            raise PermissionDeniedError("Only listing creator can delete this listing.", code="marketplace_listing_delete_forbidden")
        offers_count = await self._repository.count_marketplace_offers_for_listing(org_id=org_id, listing_id=listing_id)
        if offers_count > 0:
            raise ValidationError(
                "Listing cannot be deleted after bids/offers exist. Withdraw it instead.",
                code="marketplace_listing_delete_has_offers",
            )
        ok = await self._repository.delete_marketplace_item(org_id=org_id, listing_id=listing_id)
        if not ok:
            raise NotFoundError("Listing not found.", code="listing_not_found")

    async def buy_marketplace_item(
        self,
        *,
        org_id: str,
        buyer_user_id: str,
        buyer_email: str | None,
        payload: MarketplaceBuyInput,
    ) -> OfferPublic:
        listing = await self._repository.find_marketplace_item(org_id=org_id, listing_id=payload.listing_id)
        if listing is None:
            raise NotFoundError("Listing not found.", code="listing_not_found")
        listing_status = str(listing.get("status", "active"))
        if listing_status in {"sold", "withdrawn"}:
            raise ValidationError(
                "This listing is not available for purchase.",
                code="marketplace_listing_unavailable",
            )
        owner_user_id = str(listing.get("owner_user_id", ""))
        if owner_user_id == buyer_user_id:
            raise ValidationError("You cannot buy your own listing.", code="marketplace_buy_own_listing")
        await self._enforce_marketplace_bid_rate_limits(
            org_id=org_id,
            listing_id=payload.listing_id,
            sender_user_id=buyer_user_id,
        )
        existing_active_offer = await self._repository.find_active_marketplace_offer_for_sender(
            org_id=org_id,
            listing_id=payload.listing_id,
            sender_user_id=buyer_user_id,
        )
        if existing_active_offer is not None:
            raise ValidationError(
                "You already have an active bid on this listing. Update or resolve it before creating another.",
                code="marketplace_bid_already_exists",
            )
        seller_email = await self._repository.find_user_email_by_user_id(user_id=owner_user_id)
        buyer_email_norm = (
            buyer_email.strip().lower() if isinstance(buyer_email, str) and buyer_email.strip() else None
        )
        if buyer_email_norm is None:
            raise ValidationError("Buyer account email is required.", code="marketplace_buyer_email_required")
        doc = await self._repository.create_offer(
            org_id=org_id,
            school_id=str(listing["school_id"]),
            school_name=str(listing["school_name"]),
            sender_user_id=buyer_user_id,
            sender_email=buyer_email_norm,
            recipient_email=seller_email,
            party_full_name=buyer_email_norm,
            party_email=buyer_email_norm,
            ownership_percentage=100.0,
            listing_id=payload.listing_id,
            offered_price=float(listing.get("price", 0)),
            offered_currency=str(listing.get("currency", "USD")),
            offer_kind="marketplace_transfer",
            expires_at=datetime.now(UTC) + timedelta(hours=self._settings.marketplace_bid_expiry_hours),
        )
        await self._repository.set_marketplace_status(
            org_id=org_id, listing_id=payload.listing_id, status="under_offer", bidder_user_id=buyer_user_id
        )
        return _map_offer(doc)

    async def bid_marketplace_item(
        self,
        *,
        org_id: str,
        buyer_user_id: str,
        buyer_email: str | None,
        payload: MarketplaceBidInput,
    ) -> OfferPublic:
        listing = await self._repository.find_marketplace_item(org_id=org_id, listing_id=payload.listing_id)
        if listing is None:
            raise NotFoundError("Listing not found.", code="listing_not_found")
        listing_status = str(listing.get("status", "active"))
        if listing_status in {"sold", "withdrawn"}:
            raise ValidationError(
                "This listing is not available for bidding.",
                code="marketplace_listing_unavailable",
            )
        owner_user_id = str(listing.get("owner_user_id", ""))
        if owner_user_id == buyer_user_id:
            raise ValidationError("You cannot bid on your own listing.", code="marketplace_bid_own_listing")
        await self._enforce_marketplace_bid_rate_limits(
            org_id=org_id,
            listing_id=payload.listing_id,
            sender_user_id=buyer_user_id,
        )
        existing_active_offer = await self._repository.find_active_marketplace_offer_for_sender(
            org_id=org_id,
            listing_id=payload.listing_id,
            sender_user_id=buyer_user_id,
        )
        if existing_active_offer is not None:
            raise ValidationError(
                "You already have an active bid on this listing. Update or resolve it before creating another.",
                code="marketplace_bid_already_exists",
            )
        seller_email = await self._repository.find_user_email_by_user_id(user_id=owner_user_id)
        buyer_email_norm = (
            buyer_email.strip().lower() if isinstance(buyer_email, str) and buyer_email.strip() else None
        )
        if buyer_email_norm is None:
            raise ValidationError("Buyer account email is required.", code="marketplace_buyer_email_required")
        doc = await self._repository.create_offer(
            org_id=org_id,
            school_id=str(listing["school_id"]),
            school_name=str(listing["school_name"]),
            sender_user_id=buyer_user_id,
            sender_email=buyer_email_norm,
            recipient_email=seller_email,
            party_full_name=buyer_email_norm,
            party_email=buyer_email_norm,
            ownership_percentage=100.0,
            listing_id=payload.listing_id,
            offered_price=payload.offered_price,
            offered_currency=payload.offered_currency,
            note=payload.note.strip() if isinstance(payload.note, str) and payload.note.strip() else None,
            offer_kind="marketplace_transfer",
            expires_at=datetime.now(UTC) + timedelta(hours=self._settings.marketplace_bid_expiry_hours),
        )
        return _map_offer(doc)

    async def list_offers(
        self,
        *,
        org_id: str,
        status: OfferStatus,
        view: OfferListView,
        user_id: str,
        user_email: str | None,
    ) -> OfferListResponse:
        docs = await self._repository.list_offers(
            org_id=org_id,
            status=status,
            view=view,
            user_id=user_id,
            user_email=user_email,
        )
        enriched_docs = [await self._enrich_offer_with_partner_access(doc) for doc in docs]
        return OfferListResponse(items=[_map_offer(doc) for doc in enriched_docs])

    async def list_offers_for_user(
        self,
        *,
        status: OfferStatus,
        view: OfferListView,
        user_id: str,
        user_email: str | None,
        org_id: str | None = None,
    ) -> OfferListResponse:
        docs = await self._repository.list_offers_for_user(
            status=status,
            view=view,
            user_id=user_id,
            user_email=user_email,
            org_id=org_id,
        )
        enriched_docs = [await self._enrich_offer_with_partner_access(doc) for doc in docs]
        return OfferListResponse(items=[_map_offer(doc) for doc in enriched_docs])

    async def create_offer(
        self,
        *,
        org_id: str,
        user_id: str,
        user_email: str | None,
        payload: OfferCreateInput,
    ) -> OfferPublic:
        school = await self._repository.find_school(org_id=org_id, school_id=payload.school_id)
        if school is None:
            raise NotFoundError("School not found.", code="school_not_found")
        doc = await self._repository.create_offer(
            org_id=org_id,
            school_id=payload.school_id,
            school_name=str(school["name"]),
            sender_user_id=user_id,
            sender_email=(user_email.strip().lower() if isinstance(user_email, str) and user_email.strip() else None),
        )
        return _map_offer(doc)

    async def shortlist_offer(
        self,
        *,
        org_id: str,
        offer_id: str,
        user_id: str,
    ) -> OfferPublic:
        offer = await self._repository.find_offer(org_id=org_id, offer_id=offer_id)
        if offer is None:
            raise NotFoundError("Offer not found.", code="offer_not_found")
        if str(offer.get("offer_kind", "")) != "marketplace_transfer":
            raise ValidationError(
                "Only marketplace transfer offers can be shortlisted.",
                code="offer_shortlist_invalid_kind",
            )
        if str(offer.get("status", "")) not in {"requested", "amendment"}:
            raise ValidationError(
                "Only active offers can be shortlisted.",
                code="offer_shortlist_invalid_status",
            )
        await self._ensure_marketplace_offer_not_expired(offer=offer, org_id=org_id, offer_id=offer_id)
        listing_id = str(offer.get("listing_id", "")).strip()
        bidder_user_id = str(offer.get("sender_user_id", "")).strip()
        if not listing_id or not bidder_user_id:
            raise ValidationError(
                "Offer is missing listing or bidder information.",
                code="offer_shortlist_invalid_payload",
            )
        listing = await self._repository.find_marketplace_item(org_id=org_id, listing_id=listing_id)
        owner_user_id = str(listing.get("owner_user_id", "")).strip() if isinstance(listing, dict) else ""
        if not owner_user_id or owner_user_id != user_id:
            raise PermissionDeniedError(
                "Only listing creator can shortlist this offer.",
                code="offer_shortlist_forbidden",
            )
        ok = await self._repository.shortlist_offer(
            org_id=org_id,
            offer_id=offer_id,
            listing_id=listing_id,
            bidder_user_id=bidder_user_id,
        )
        if not ok:
            raise NotFoundError("Offer not found.", code="offer_not_found")
        updated = await self._repository.find_offer(org_id=org_id, offer_id=offer_id)
        if updated is None:
            raise NotFoundError("Offer not found.", code="offer_not_found")
        return _map_offer(updated)

    async def unshortlist_offer(
        self,
        *,
        org_id: str,
        offer_id: str,
        user_id: str,
    ) -> OfferPublic:
        offer = await self._repository.find_offer(org_id=org_id, offer_id=offer_id)
        if offer is None:
            raise NotFoundError("Offer not found.", code="offer_not_found")
        if str(offer.get("offer_kind", "")) != "marketplace_transfer":
            raise ValidationError(
                "Only marketplace transfer offers can be unshortlisted.",
                code="offer_unshortlist_invalid_kind",
            )
        await self._ensure_marketplace_offer_not_expired(offer=offer, org_id=org_id, offer_id=offer_id)
        if not bool(offer.get("shortlisted", False)):
            raise ValidationError(
                "Offer is not shortlisted.",
                code="offer_unshortlist_invalid_state",
            )
        listing_id = str(offer.get("listing_id", "")).strip()
        if not listing_id:
            raise ValidationError(
                "Offer is missing listing information.",
                code="offer_unshortlist_invalid_payload",
            )
        listing = await self._repository.find_marketplace_item(org_id=org_id, listing_id=listing_id)
        owner_user_id = str(listing.get("owner_user_id", "")).strip() if isinstance(listing, dict) else ""
        if not owner_user_id or owner_user_id != user_id:
            raise PermissionDeniedError(
                "Only listing creator can unshortlist this offer.",
                code="offer_unshortlist_forbidden",
            )
        ok = await self._repository.unshortlist_offer(org_id=org_id, offer_id=offer_id, listing_id=listing_id)
        if not ok:
            raise NotFoundError("Offer not found.", code="offer_not_found")
        updated = await self._repository.find_offer(org_id=org_id, offer_id=offer_id)
        if updated is None:
            raise NotFoundError("Offer not found.", code="offer_not_found")
        return _map_offer(updated)

    async def update_offer_status(
        self,
        *,
        org_id: str,
        offer_id: str,
        user_id: str,
        user_email: str | None,
        payload: OfferStatusUpdateInput,
    ) -> OfferPublic:
        existing = await self._repository.find_offer(org_id=org_id, offer_id=offer_id)
        if existing is None:
            raise NotFoundError("Offer not found.", code="offer_not_found")
        current_status_raw = existing.get("status")
        current_status = (
            str(current_status_raw)
            if isinstance(current_status_raw, str) and current_status_raw in {"requested", "approved", "amendment", "rejected"}
            else "requested"
        )
        self._ensure_valid_offer_transition(current_status=current_status, next_status=payload.status)
        offer_kind_raw = existing.get("offer_kind")
        offer_kind_str = offer_kind_raw if isinstance(offer_kind_raw, str) else ""
        if offer_kind_str == "marketplace_transfer":
            await self._ensure_marketplace_offer_not_expired(offer=existing, org_id=org_id, offer_id=offer_id)
        marketplace_owner_can_finalize = False
        if payload.status == "approved" and offer_kind_str == "marketplace_transfer":
            listing_id_raw = existing.get("listing_id")
            if not isinstance(listing_id_raw, str) or not listing_id_raw.strip():
                raise ValidationError(
                    "Marketplace transfer offer is missing listing information.",
                    code="marketplace_transfer_listing_missing",
                )
            listing = await self._repository.find_marketplace_item(org_id=org_id, listing_id=listing_id_raw.strip())
            listing_owner_user_id = (
                str(listing.get("owner_user_id", "")).strip() if isinstance(listing, dict) else ""
            )
            marketplace_owner_can_finalize = bool(listing_owner_user_id and listing_owner_user_id == user_id)
        normalized_user_email = (
            user_email.strip().lower() if isinstance(user_email, str) and user_email.strip() else ""
        )
        if not normalized_user_email and not marketplace_owner_can_finalize:
            raise PermissionDeniedError(
                "Only offer parties can update offer status.",
                code="offer_update_forbidden",
            )
        negotiation_turn_raw = existing.get("negotiation_turn")
        negotiation_turn = (
            str(negotiation_turn_raw)
            if isinstance(negotiation_turn_raw, str) and negotiation_turn_raw in {"sender", "recipient"}
            else "recipient"
        )
        sender_email = existing.get("sender_email")
        recipient_email = existing.get("recipient_email")
        sender_email_norm = sender_email.strip().lower() if isinstance(sender_email, str) and sender_email.strip() else ""
        recipient_email_norm = (
            recipient_email.strip().lower() if isinstance(recipient_email, str) and recipient_email.strip() else ""
        )
        expected_actor_email = recipient_email_norm if negotiation_turn == "recipient" else sender_email_norm
        if (not expected_actor_email or normalized_user_email != expected_actor_email) and not marketplace_owner_can_finalize:
            raise PermissionDeniedError(
                "This offer is waiting for the other party to respond.",
                code="offer_update_forbidden",
            )
        if payload.status == "amendment":
            amendment_data = payload.amendment_data if isinstance(payload.amendment_data, dict) else None
            if not amendment_data:
                raise ValidationError(
                    "Amendment data is required when proposing an amendment.",
                    code="amendment_data_required",
                )
            _validate_offer_amendment_data(amendment_data)
            if offer_kind_str == "marketplace_transfer":
                amendment_rounds_raw = existing.get("amendment_rounds", 0)
                amendment_rounds = amendment_rounds_raw if isinstance(amendment_rounds_raw, int) else 0
                if amendment_rounds >= self._settings.marketplace_max_amendment_rounds:
                    raise ValidationError(
                        "This bid reached the maximum allowed amendment rounds.",
                        code="marketplace_amendment_round_limit_reached",
                    )
            next_turn = "sender" if negotiation_turn == "recipient" else "recipient"
        else:
            next_turn = negotiation_turn
        amendment_rounds_next: int | None = None
        if offer_kind_str == "marketplace_transfer" and payload.status == "amendment":
            amendment_rounds_raw = existing.get("amendment_rounds", 0)
            amendment_rounds = amendment_rounds_raw if isinstance(amendment_rounds_raw, int) else 0
            amendment_rounds_next = amendment_rounds + 1

        if payload.status == "approved" and offer_kind_str == "marketplace_transfer":
            school_id = str(existing["school_id"])
            if not bool(existing.get("shortlisted", False)):
                raise ValidationError(
                    "Only shortlisted marketplace offers can be approved.",
                    code="marketplace_approve_requires_shortlist",
                )
            listing_id_raw = existing.get("listing_id")
            if not isinstance(listing_id_raw, str) or not listing_id_raw.strip():
                raise ValidationError(
                    "Marketplace transfer offer is missing listing information.",
                    code="marketplace_transfer_listing_missing",
                )
            listing_id = listing_id_raw.strip()
            listing = await self._repository.find_marketplace_item(org_id=org_id, listing_id=listing_id)
            listing_owner_user_id = (
                str(listing.get("owner_user_id", "")).strip() if isinstance(listing, dict) else ""
            )
            if not listing_owner_user_id or listing_owner_user_id != user_id:
                raise PermissionDeniedError(
                    "Only listing creator can approve marketplace offers.",
                    code="marketplace_offer_owner_forbidden",
                )
            canonical = await self._repository.find_shortlisted_offer_for_listing(
                org_id=org_id,
                listing_id=listing_id,
            )
            canonical_id = str(canonical["_id"]) if isinstance(canonical, dict) and canonical.get("_id") is not None else ""
            if canonical_id != offer_id:
                raise ValidationError(
                    "This offer is not the active shortlisted bid for the listing.",
                    code="marketplace_approve_shortlist_mismatch",
                )
            buyer_user_id_raw = existing.get("sender_user_id")
            if not isinstance(buyer_user_id_raw, str) or not buyer_user_id_raw.strip():
                raise ValidationError(
                    "Marketplace transfer offer is missing buyer identity.",
                    code="marketplace_transfer_buyer_missing",
                )
            buyer_user_id = buyer_user_id_raw.strip()

            school_updates: dict[str, object] | None = None
            school = await self._repository.find_school(org_id=org_id, school_id=school_id)
            if school is not None:
                buyer_email_norm = (
                    existing.get("party_email").strip().lower()
                    if isinstance(existing.get("party_email"), str) and existing.get("party_email").strip()
                    else None
                )
                if buyer_email_norm:
                    school_updates = {
                        "partners": [
                            {
                                "full_name": buyer_email_norm,
                                "email": buyer_email_norm,
                                "ownership_percentage": 100.0,
                                "share_accesses": [],
                            }
                        ]
                    }

            try:
                committed = await self._repository.commit_marketplace_transfer_approval(
                    org_id=org_id,
                    offer_id=offer_id,
                    school_id=school_id,
                    listing_id=listing_id,
                    buyer_user_id=buyer_user_id,
                    negotiation_turn=next_turn,
                    school_updates=school_updates,
                )
            except RuntimeError as exc:
                msg = str(exc)
                if msg in {"marketplace_commit_school_not_found", "marketplace_commit_listing_not_found"}:
                    raise NotFoundError(
                        "School or listing not found during marketplace transfer.",
                        code="marketplace_commit_not_found",
                    ) from exc
                raise

            if not committed:
                raise ValidationError(
                    "Offer or listing changed while approving; refresh and try again.",
                    code="marketplace_approve_concurrent",
                )

            updated_doc = await self._repository.find_offer(org_id=org_id, offer_id=offer_id)
            if updated_doc is None:
                raise NotFoundError("Offer not found.", code="offer_not_found")
            enriched_doc = await self._enrich_offer_with_partner_access(updated_doc)
            return _map_offer(enriched_doc)

        updated = await self._repository.update_offer_status(
            org_id=org_id,
            offer_id=offer_id,
            status=payload.status,
            amendment_data=payload.amendment_data,
            negotiation_turn=next_turn,
            amendment_rounds=amendment_rounds_next,
        )
        if not updated:
            raise NotFoundError("Offer not found.", code="offer_not_found")
        if payload.status == "rejected":
            offer_kind = existing.get("offer_kind")
            listing_id = existing.get("listing_id")
            if isinstance(offer_kind, str) and offer_kind == "marketplace_transfer" and isinstance(listing_id, str):
                await self._repository.set_marketplace_status(org_id=org_id, listing_id=listing_id, status="active")
        if payload.status == "approved":
            school_id = str(existing["school_id"])
            mk_kind = existing.get("offer_kind")
            if not (isinstance(mk_kind, str) and mk_kind == "marketplace_transfer"):
                party_email = existing.get("party_email")
                party_email_norm = party_email.strip().lower() if isinstance(party_email, str) and party_email.strip() else ""
                if party_email_norm and normalized_user_email == party_email_norm:
                    await self._repository.upsert_school_membership(
                        user_id=user_id,
                        school_id=school_id,
                        org_id=org_id,
                        role_keys=["school_owner"],
                    )
                elif party_email_norm:
                    party_user_id = await self._repository.find_user_id_by_email(email=party_email_norm)
                    if party_user_id:
                        await self._repository.upsert_school_membership(
                            user_id=party_user_id,
                            school_id=school_id,
                            org_id=org_id,
                            role_keys=["school_owner"],
                        )
                # Apply amendment changes if any (payload wins; otherwise use latest persisted amendment).
                amendment_to_apply = (
                    payload.amendment_data
                    if isinstance(payload.amendment_data, dict)
                    else existing.get("amendment_data")
                    if isinstance(existing.get("amendment_data"), dict)
                    else None
                )
                if amendment_to_apply:
                    _validate_offer_amendment_data(amendment_to_apply)
                    await self._apply_amendment_changes(
                        org_id=org_id,
                        school_id=school_id,
                        offer_id=offer_id,
                        amendment_data=amendment_to_apply,
                        party_email=existing.get("party_email"),
                    )
        updated_doc = await self._repository.find_offer(org_id=org_id, offer_id=offer_id)
        if updated_doc is not None:
            enriched_doc = await self._enrich_offer_with_partner_access(updated_doc)
            return _map_offer(enriched_doc)
        raise NotFoundError("Offer not found.", code="offer_not_found")

    async def _enforce_marketplace_bid_rate_limits(
        self,
        *,
        org_id: str,
        listing_id: str,
        sender_user_id: str,
    ) -> None:
        latest_offer = await self._repository.find_latest_marketplace_offer_for_sender(
            org_id=org_id,
            listing_id=listing_id,
            sender_user_id=sender_user_id,
        )
        if isinstance(latest_offer, dict):
            last_requested = latest_offer.get("requested_at")
            if isinstance(last_requested, datetime):
                elapsed = (datetime.now(UTC) - last_requested).total_seconds()
                if self._settings.marketplace_bid_cooldown_seconds > 0 and elapsed < self._settings.marketplace_bid_cooldown_seconds:
                    raise ValidationError(
                        "Please wait before submitting another bid on this listing.",
                        code="marketplace_bid_cooldown_active",
                    )
        if self._settings.marketplace_bid_rate_limit_max_creates > 0:
            since = datetime.now(UTC) - timedelta(seconds=self._settings.marketplace_bid_rate_limit_window_seconds)
            recent_count = await self._repository.count_recent_marketplace_offer_creations_for_sender(
                sender_user_id=sender_user_id,
                since=since,
            )
            if recent_count >= self._settings.marketplace_bid_rate_limit_max_creates:
                raise ValidationError(
                    "Too many bids submitted in a short period. Please try again later.",
                    code="marketplace_bid_rate_limited",
                )

    async def _ensure_marketplace_offer_not_expired(
        self,
        *,
        offer: dict[str, object],
        org_id: str,
        offer_id: str,
    ) -> None:
        expires_at = offer.get("expires_at")
        if not isinstance(expires_at, datetime):
            return
        status = str(offer.get("status", "requested"))
        if status not in {"requested", "amendment"}:
            return
        if expires_at > datetime.now(UTC):
            return
        await self._repository.update_offer_status(
            org_id=org_id,
            offer_id=offer_id,
            status="rejected",
            amendment_data={"note": "expired_by_timer"},
        )
        raise ValidationError(
            "This bid offer expired and can no longer be updated.",
            code="marketplace_bid_expired",
        )


    def _ensure_valid_offer_transition(self, *, current_status: str, next_status: OfferStatus) -> None:
        allowed_transitions: dict[str, set[str]] = {
            "requested": {"approved", "rejected", "amendment"},
            "amendment": {"approved", "rejected", "amendment"},
            "approved": set(),
            "rejected": set(),
        }
        allowed = allowed_transitions.get(current_status, set())
        if next_status not in allowed:
            raise ValidationError(
                f"Invalid offer transition: {current_status} -> {next_status}.",
                code="offer_transition_invalid",
            )


    async def _apply_amendment_changes(
        self,
        *,
        org_id: str,
        school_id: str,
        offer_id: str,
        amendment_data: dict[str, object],
        party_email: str | None,
    ) -> None:
        """Apply amendment changes to the school when accepting an amendment."""
        school = await self._repository.find_school(org_id=org_id, school_id=school_id)
        if school is None:
            return  # School not found, skip

        updates = {}
        if "ownership_percentage" in amendment_data and party_email:
            # Update partner's ownership
            partners = school.get("partners", [])
            for partner in partners:
                if isinstance(partner, dict) and partner.get("email") == party_email:
                    partner["ownership_percentage"] = amendment_data["ownership_percentage"]
                    updates["partners"] = partners
                    break

        if "share_accesses" in amendment_data and party_email:
            partners = school.get("partners", [])
            for partner in partners:
                if isinstance(partner, dict) and partner.get("email") == party_email:
                    partner["share_accesses"] = amendment_data["share_accesses"]
                    updates["partners"] = partners
                    break

        if updates:
            await self._repository.update_school(org_id=org_id, school_id=school_id, updates=updates)

    async def _enrich_offer_with_partner_access(self, offer_doc: dict[str, object]) -> dict[str, object]:
        """Ensure offer carries latest partner access so amendment UI can preload current values."""
        existing_accesses = offer_doc.get("share_accesses")
        if isinstance(existing_accesses, list) and len(existing_accesses) > 0:
            return offer_doc
        school_id_raw = offer_doc.get("school_id")
        org_id_raw = offer_doc.get("org_id")
        party_email_raw = offer_doc.get("party_email")
        if not isinstance(school_id_raw, str) or not isinstance(org_id_raw, str):
            return offer_doc
        if not isinstance(party_email_raw, str) or not party_email_raw.strip():
            return offer_doc
        school = await self._repository.find_school(org_id=org_id_raw, school_id=school_id_raw)
        if school is None:
            return offer_doc
        party_email_norm = party_email_raw.strip().lower()
        for partner in school.get("partners", []):
            if not isinstance(partner, dict):
                continue
            partner_email = partner.get("email")
            if not isinstance(partner_email, str) or partner_email.strip().lower() != party_email_norm:
                continue
            partner_accesses = partner.get("share_accesses")
            if isinstance(partner_accesses, list) and len(partner_accesses) > 0:
                enriched = dict(offer_doc)
                enriched["share_accesses"] = partner_accesses
                return enriched
            break
        return offer_doc


def _validate_school_create_payload(payload: SchoolCreateInput, *, sender_email: str | None = None) -> None:
    if len(payload.partners) > 0:
        total_ownership = sum(float(partner.ownership_percentage) for partner in payload.partners)
        if abs(total_ownership - 100.0) >= 0.001:
            raise ValidationError(
                "Total partner ownership must equal 100%.",
                code="school_partner_ownership_invalid",
                details={"ownershipTotal": total_ownership},
            )
        missing_partner_email = [partner.full_name for partner in payload.partners if not partner.email or not partner.email.strip()]
        if missing_partner_email:
            raise ValidationError(
                "Partner email is required when partner ownership is provided.",
                code="school_partner_email_required",
                details={"partners": missing_partner_email},
            )
    normalized_sender_email = sender_email.strip().lower() if isinstance(sender_email, str) and sender_email.strip() else None
    allowed_share_statuses = {"can_view", "can_edit", "can_manage"}
    invalid_statuses: list[str] = []
    partners_missing_share_access: list[str] = []
    for partner in payload.partners:
        partner_email = partner.email.strip().lower() if partner.email else ""
        is_sender_partner = normalized_sender_email is not None and partner_email == normalized_sender_email
        if not is_sender_partner and len(partner.share_accesses) == 0:
            partners_missing_share_access.append(partner.full_name)
        for access in partner.share_accesses:
            if access.status not in allowed_share_statuses:
                invalid_statuses.append(access.status)
    if partners_missing_share_access:
        raise ValidationError(
            "Each partner must have share access configured.",
            code="school_partner_share_access_required",
            details={"partners": partners_missing_share_access},
        )
    if invalid_statuses:
        raise ValidationError(
            "One or more partner share access statuses are invalid.",
            code="school_share_status_invalid",
            details={"invalidStatuses": invalid_statuses},
        )


def _validate_offer_amendment_data(amendment_data: dict[str, object]) -> None:
    has_supported_field = False
    if "ownership_percentage" in amendment_data:
        has_supported_field = True
        raw = amendment_data["ownership_percentage"]
        if not isinstance(raw, (int, float)):
            raise ValidationError(
                "Amendment ownership percentage must be a number.",
                code="offer_amendment_ownership_invalid",
            )
        value = float(raw)
        if value < 0 or value > 100:
            raise ValidationError(
                "Amendment ownership percentage must be between 0 and 100.",
                code="offer_amendment_ownership_invalid",
            )
    if "share_accesses" in amendment_data:
        has_supported_field = True
        raw_accesses = amendment_data["share_accesses"]
        if not isinstance(raw_accesses, list) or len(raw_accesses) == 0:
            raise ValidationError(
                "Amendment share accesses must be a non-empty list.",
                code="offer_amendment_share_access_invalid",
            )
        allowed_share_statuses = {"can_view", "can_edit", "can_manage"}
        for item in raw_accesses:
            if not isinstance(item, dict):
                raise ValidationError(
                    "Amendment share accesses must contain objects.",
                    code="offer_amendment_share_access_invalid",
                )
            access_name = item.get("access_name")
            status = item.get("status")
            if not isinstance(access_name, str) or not access_name.strip():
                raise ValidationError(
                    "Amendment share access must include access_name.",
                    code="offer_amendment_share_access_invalid",
                )
            if not isinstance(status, str) or status not in allowed_share_statuses:
                raise ValidationError(
                    "Amendment share access status is invalid.",
                    code="offer_amendment_share_access_invalid",
                )
    if "offered_price" in amendment_data:
        has_supported_field = True
        raw_price = amendment_data["offered_price"]
        if not isinstance(raw_price, (int, float)):
            raise ValidationError(
                "Amendment offered price must be a number.",
                code="offer_amendment_price_invalid",
            )
        if float(raw_price) <= 0:
            raise ValidationError(
                "Amendment offered price must be greater than 0.",
                code="offer_amendment_price_invalid",
            )
    if "offered_currency" in amendment_data:
        has_supported_field = True
        raw_currency = amendment_data["offered_currency"]
        if not isinstance(raw_currency, str) or not raw_currency.strip():
            raise ValidationError(
                "Amendment offered currency must be a non-empty string.",
                code="offer_amendment_currency_invalid",
            )
    if "note" in amendment_data:
        has_supported_field = True
        raw_note = amendment_data["note"]
        if raw_note is not None and not isinstance(raw_note, str):
            raise ValidationError(
                "Amendment note must be text.",
                code="offer_amendment_note_invalid",
            )
    if not has_supported_field:
        raise ValidationError(
            "Amendment data must include editable offer fields.",
            code="offer_amendment_invalid",
        )

def _map_school(doc: dict[str, object]) -> SchoolPublic:
    custom_fields_raw = doc.get("custom_fields", [])
    custom_fields = []
    if isinstance(custom_fields_raw, list):
        for item in custom_fields_raw:
            if not isinstance(item, dict):
                continue
            key = item.get("key")
            value = item.get("value")
            if not isinstance(key, str) or not isinstance(value, str):
                continue
            key_clean = key.strip()
            value_clean = value.strip()
            if not key_clean or not value_clean:
                continue
            custom_fields.append({"key": key_clean, "value": value_clean})
    return SchoolPublic(
        id=str(doc["_id"]),
        org_id=str(doc["org_id"]),
        name=str(doc["name"]),
        slug=str(doc["slug"]),
        school_type=str(doc["school_type"]),
        email=(str(doc["email"]) if doc.get("email") is not None else None),
        logo_url=(str(doc["logo_url"]) if doc.get("logo_url") is not None else None),
        custom_fields=custom_fields,
        partners=doc.get("partners", []),  # type: ignore[arg-type]
        documents=doc.get("documents", []),  # type: ignore[arg-type]
        onboarding_status=str(doc.get("onboarding_status", "active")),  # type: ignore[arg-type]
        archived=bool(doc.get("archived", False)),
        created_at=doc["created_at"],  # type: ignore[arg-type]
        updated_at=doc["updated_at"],  # type: ignore[arg-type]
    )


def _map_marketplace_item(doc: dict[str, object]) -> MarketplaceViewResponse:
    return MarketplaceViewResponse(
        id=str(doc["_id"]),
        org_id=str(doc["org_id"]),
        school_id=str(doc["school_id"]),
        school_name=str(doc["school_name"]),
        school_type=str(doc.get("school_type", "")),
        title=str(doc["title"]),
        description=str(doc["description"]),
        price=float(doc["price"]),
        currency=str(doc.get("currency", "USD")),
        owner_user_id=str(doc["owner_user_id"]),
        bidder_user_id=(str(doc["bidder_user_id"]) if doc.get("bidder_user_id") is not None else None),
        status=str(doc.get("status", "active")),  # type: ignore[arg-type]
        created_at=doc["created_at"],  # type: ignore[arg-type]
    )


def _map_offer(doc: dict[str, object]) -> OfferPublic:
    raw_amendment = doc.get("amendment_data")
    amendment_data = raw_amendment if isinstance(raw_amendment, dict) else None
    pct = doc.get("ownership_percentage")
    if amendment_data is not None and "ownership_percentage" in amendment_data:
        amended_pct = amendment_data.get("ownership_percentage")
        if isinstance(amended_pct, (int, float)):
            pct = float(amended_pct)
    share_accesses_raw = doc.get("share_accesses", [])
    if amendment_data is not None and "share_accesses" in amendment_data:
        amended_accesses = amendment_data.get("share_accesses")
        if isinstance(amended_accesses, list):
            share_accesses_raw = amended_accesses
    offered_price = doc.get("offered_price")
    offered_currency = doc.get("offered_currency")
    note = doc.get("note")
    if amendment_data is not None:
        amended_price = amendment_data.get("offered_price")
        if isinstance(amended_price, (int, float)):
            offered_price = float(amended_price)
        amended_currency = amendment_data.get("offered_currency")
        if isinstance(amended_currency, str) and amended_currency.strip():
            offered_currency = amended_currency.strip().upper()
        if "note" in amendment_data:
            amended_note = amendment_data.get("note")
            note = amended_note if isinstance(amended_note, str) else None
    return OfferPublic(
        id=str(doc["_id"]),
        org_id=str(doc["org_id"]),
        school_id=str(doc["school_id"]),
        school_name=str(doc["school_name"]),
        status=doc["status"],  # type: ignore[arg-type]
        requested_at=doc["requested_at"],  # type: ignore[arg-type]
        updated_at=doc["updated_at"],  # type: ignore[arg-type]
        recipient_email=(str(doc["recipient_email"]) if doc.get("recipient_email") is not None else None),
        sender_user_id=(str(doc["sender_user_id"]) if doc.get("sender_user_id") is not None else None),
        sender_email=(str(doc["sender_email"]) if doc.get("sender_email") is not None else None),
        negotiation_turn=str(doc.get("negotiation_turn", "recipient")),  # type: ignore[arg-type]
        listing_id=(str(doc["listing_id"]) if doc.get("listing_id") is not None else None),
        shortlisted=bool(doc.get("shortlisted", False)),
        party_full_name=(str(doc["party_full_name"]) if doc.get("party_full_name") is not None else None),
        party_email=(str(doc["party_email"]) if doc.get("party_email") is not None else None),
        ownership_percentage=(float(pct) if pct is not None else None),
        share_accesses=share_accesses_raw,  # type: ignore[arg-type]
        offered_price=(float(offered_price) if offered_price is not None else None),
        offered_currency=(str(offered_currency) if offered_currency is not None else None),
        note=(str(note) if note is not None else None),
        offer_kind=(str(doc["offer_kind"]) if doc.get("offer_kind") is not None else None),
        amendment_data=amendment_data,  # type: ignore[arg-type]
        expires_at=(doc["expires_at"] if isinstance(doc.get("expires_at"), datetime) else None),  # type: ignore[arg-type]
        amendment_rounds=(int(doc["amendment_rounds"]) if isinstance(doc.get("amendment_rounds"), int) else 0),
    )


def _map_class_enrollment(
    doc: dict[str, object],
    user_doc: dict[str, object],
) -> ClassEnrollmentPublic:
    return ClassEnrollmentPublic(
        id=str(doc["_id"]),
        org_id=str(doc["org_id"]),
        school_id=str(doc["school_id"]),
        class_workspace_item_id=str(doc["class_workspace_item_id"]),
        user_id=str(doc["user_id"]),
        role=str(doc.get("role", "student")),  # type: ignore[arg-type]
        status=str(doc.get("status", "active")),  # type: ignore[arg-type]
        enrolled_at=doc["enrolled_at"],  # type: ignore[arg-type]
        updated_at=doc["updated_at"],  # type: ignore[arg-type]
        enrolled_by_user_id=(
            str(doc["enrolled_by_user_id"])
            if doc.get("enrolled_by_user_id") is not None
            else None
        ),
        user=ClassEnrollmentUserPublic(
            user_id=str(user_doc["_id"]),
            username=(str(user_doc["username"]) if user_doc.get("username") is not None else None),
            email=(str(user_doc["email"]) if user_doc.get("email") is not None else None),
            full_name=(str(user_doc["full_name"]) if user_doc.get("full_name") is not None else None),
        ),
    )


def _map_class_session(doc: dict[str, object]) -> ClassSessionPublic:
    creation_raw = doc.get("creation_mode")
    creation_mode = creation_raw if creation_raw in ("single", "multiple") else None
    weight_val = doc.get("weight")
    duration_val = doc.get("duration_minutes")
    return ClassSessionPublic(
        id=str(doc["_id"]),
        org_id=str(doc["org_id"]),
        school_id=str(doc["school_id"]),
        class_workspace_item_id=str(doc["class_workspace_item_id"]),
        title=str(doc["title"]),
        description=(str(doc["description"]) if doc.get("description") is not None else None),
        weight=(float(weight_val) if weight_val is not None else None),
        duration_minutes=(int(duration_val) if isinstance(duration_val, int) else None),
        session_type=str(doc.get("session_type", "virtual")),  # type: ignore[arg-type]
        scheduled_at=(doc["scheduled_at"] if isinstance(doc.get("scheduled_at"), datetime) else None),  # type: ignore[arg-type]
        status=str(doc.get("status", "draft")),  # type: ignore[arg-type]
        creation_mode=creation_mode,  # type: ignore[arg-type]
        created_at=doc["created_at"],  # type: ignore[arg-type]
        updated_at=doc["updated_at"],  # type: ignore[arg-type]
    )


def _map_workspace_item(doc: dict[str, object]) -> SchoolWorkspaceItemPublic:
    metadata = doc.get("metadata")
    metadata_safe = metadata if isinstance(metadata, dict) else {}
    return SchoolWorkspaceItemPublic(
        id=str(doc["_id"]),
        org_id=str(doc["org_id"]),
        school_id=str(doc["school_id"]),
        parent_id=(str(doc["parent_id"]) if doc.get("parent_id") is not None else None),
        type=str(doc["type"]),  # type: ignore[arg-type]
        title=str(doc["title"]),
        description=(str(doc["description"]) if doc.get("description") is not None else None),
        metadata=metadata_safe,
        is_root=bool(doc.get("is_root", False)),
        created_at=doc["created_at"],  # type: ignore[arg-type]
        updated_at=doc["updated_at"],  # type: ignore[arg-type]
    )
