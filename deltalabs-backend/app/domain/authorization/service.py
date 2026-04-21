"""Authorization service (membership + RBAC + relationship predicates)."""

from __future__ import annotations

from typing import TypedDict
from uuid import uuid4

from app.core.config import get_settings
from app.core.exceptions import ConflictError, NotFoundError, PermissionDeniedError, ValidationError
from app.domain.authorization.repository import Repository
from app.domain.authorization.schemas import (
    AuthorizationAccessProfile,
    AuthorizationDecision,
    MyOrgsResponse,
    OrgCreateRequest,
    OrgCreateResponse,
    OrgJoinResponse,
    OrgPublic,
    PermissionCheckRequest,
    ScopeType,
)


# ################################ SERVICE ################################
# Authorization decision engine and org lifecycle helpers.
class Service:
    """Centralized allow/deny decision engine."""

    def __init__(self, repository: Repository) -> None:
        self._repository = repository

    async def bootstrap_defaults(self) -> None:
        """Ensure indexes and baseline role catalog exist."""
        await self._repository.ensure_indexes()
        settings = get_settings()
        await self._repository.upsert_default_org(
            slug=settings.authz_default_org_slug,
            name=settings.authz_default_org_name,
        )
        for row in _DEFAULT_ROLES:
            await self._repository.upsert_role_definition(
                role_key=row["role_key"],
                title=row["title"],
                permissions=row["permissions"],
                description=row.get("description"),
                membership_state=row.get("membership_state", "member"),
                membership_rank=row.get("membership_rank", 1),
            )

    async def require_permission(self, *, user_id: str, payload: PermissionCheckRequest) -> None:
        decision = await self.authorize(user_id=user_id, payload=payload)
        if not decision.allowed:
            raise PermissionDeniedError(
                "You do not have permission to perform this action.",
                code="permission_denied",
                details={
                    "reason": decision.reason,
                    "permission": decision.permission,
                    "orgId": decision.org_id,
                    "scopeType": decision.scope_type,
                    "scopeId": decision.scope_id,
                },
            )

    async def authorize(
        self,
        *,
        user_id: str,
        payload: PermissionCheckRequest,
    ) -> AuthorizationDecision:
        membership = await self._repository.find_membership(org_id=payload.org_id, user_id=user_id)
        if membership is None:
            return AuthorizationDecision(
                allowed=False,
                reason="missing_org_membership",
                permission=payload.permission,
                org_id=payload.org_id,
                scope_type=payload.scope_type,
                scope_id=payload.scope_id,
            )

        scope_pairs = _scope_resolution_chain(
            scope_type=payload.scope_type,
            scope_id=payload.scope_id,
            org_id=payload.org_id,
        )
        bindings = await self._repository.list_role_bindings(
            org_id=payload.org_id,
            user_id=user_id,
            scope_pairs=scope_pairs,
        )
        role_keys = sorted({str(row["role_key"]) for row in bindings})
        definitions = await self._repository.list_role_definitions_for_keys(role_keys)
        effective_permissions: set[str] = set()
        for definition in definitions:
            for permission in definition.get("permissions", []):
                effective_permissions.add(str(permission))

        if payload.permission in effective_permissions or "*" in effective_permissions:
            return AuthorizationDecision(
                allowed=True,
                reason="permission_granted",
                permission=payload.permission,
                org_id=payload.org_id,
                scope_type=payload.scope_type,
                scope_id=payload.scope_id,
            )

        if (
            payload.permission == "student:read_progress"
            and payload.resource_owner_user_id is not None
        ):
            for relation in ("parent_of", "guardian_of", "mentor_of"):
                if await self._repository.has_relationship(
                    org_id=payload.org_id,
                    relation=relation,
                    from_user_id=user_id,
                    to_user_id=payload.resource_owner_user_id,
                ):
                    return AuthorizationDecision(
                        allowed=True,
                        reason=f"relationship_{relation}",
                        permission=payload.permission,
                        org_id=payload.org_id,
                        scope_type=payload.scope_type,
                        scope_id=payload.scope_id,
                    )

        return AuthorizationDecision(
            allowed=False,
            reason="permission_missing",
            permission=payload.permission,
            org_id=payload.org_id,
            scope_type=payload.scope_type,
            scope_id=payload.scope_id,
        )

    async def get_access_profile(
        self,
        *,
        user_id: str,
        org_id: str,
    ) -> AuthorizationAccessProfile:
        membership = await self._repository.find_membership(org_id=org_id, user_id=user_id)
        if membership is None:
            return AuthorizationAccessProfile(
                org_id=org_id,
                role_keys=[],
                permissions=[],
                membership_state="none",
            )

        bindings = await self._repository.list_role_bindings_for_user_in_org(
            org_id=org_id,
            user_id=user_id,
        )
        role_keys = sorted({str(row["role_key"]) for row in bindings})
        definitions = await self._repository.list_role_definitions_for_keys(role_keys)
        permission_set: set[str] = set()
        membership_state = "member"
        membership_rank = 1
        for definition in definitions:
            for permission in definition.get("permissions", []):
                permission_set.add(str(permission))
            state = str(definition.get("membership_state", "member"))
            rank = int(definition.get("membership_rank", 1))
            if rank > membership_rank:
                membership_rank = rank
                membership_state = state

        return AuthorizationAccessProfile(
            org_id=org_id,
            role_keys=role_keys,
            permissions=sorted(permission_set),
            membership_state=membership_state,
        )

    async def create_org_for_user(
        self,
        *,
        user_id: str,
        payload: OrgCreateRequest,
    ) -> OrgCreateResponse:
        normalized_slug = _normalize_slug(payload.slug)
        if len(normalized_slug) < 2:
            raise ValidationError("Invalid organization slug.", code="invalid_org_slug")
        existing = await self._repository.find_org_by_slug(normalized_slug)
        if existing is not None:
            raise ConflictError("Organization slug already exists.", code="org_slug_exists")
        org_doc = await self._repository.create_org(slug=normalized_slug, name=payload.name.strip())
        org_id = str(org_doc["_id"])
        await self._repository.upsert_membership(org_id=org_id, user_id=user_id, status="active")
        await self._repository.upsert_role_binding(
            org_id=org_id,
            user_id=user_id,
            role_key="org_owner",
            scope_type="org",
            scope_id=org_id,
        )
        return OrgCreateResponse(
            org=_doc_to_org_public(org_doc),
            membership_state="owner",
            role_keys=["org_owner"],
        )

    async def create_workspace_org_for_school_owner(
        self,
        *,
        user_id: str,
        workspace_name: str,
    ) -> OrgCreateResponse:
        """Create a dedicated tenant org for a new school; user becomes org_owner."""
        trimmed = workspace_name.strip()
        if len(trimmed) < 2:
            raise ValidationError("Invalid workspace name.", code="invalid_workspace_name")
        safe_name = trimmed[:120]
        for _ in range(8):
            slug = f"ws-{uuid4().hex[:12]}"
            try:
                return await self.create_org_for_user(
                    user_id=user_id,
                    payload=OrgCreateRequest(name=safe_name, slug=slug),
                )
            except ConflictError:
                continue
        raise ConflictError(
            "Could not allocate a unique organization slug.",
            code="org_slug_exhausted",
        )

    async def list_my_orgs(self, *, user_id: str) -> MyOrgsResponse:
        docs = await self._repository.list_orgs_for_user(user_id=user_id)
        return MyOrgsResponse(items=[_doc_to_org_public(doc) for doc in docs])

    async def list_org_ids_where_user_is_owner(self, *, user_id: str) -> list[str]:
        """Org ids where the user has the ``org_owner`` role (stable sort: first is primary tenant)."""
        my = await self.list_my_orgs(user_id=user_id)
        owner_ids: list[str] = []
        for org in my.items:
            profile = await self.get_access_profile(user_id=user_id, org_id=org.id)
            if "org_owner" in profile.role_keys:
                owner_ids.append(org.id)
        return sorted(owner_ids)

    async def join_org(self, *, user_id: str, org_id: str) -> OrgJoinResponse:
        org_doc = await self._repository.find_org_by_id(org_id)
        if org_doc is None:
            raise NotFoundError("Organization not found.", code="org_not_found")
        await self._repository.upsert_membership(org_id=org_id, user_id=user_id, status="active")
        profile = await self.get_access_profile(user_id=user_id, org_id=org_id)
        if not profile.role_keys:
            await self._repository.upsert_role_binding(
                org_id=org_id,
                user_id=user_id,
                role_key="student",
                scope_type="org",
                scope_id=org_id,
            )
            profile = await self.get_access_profile(user_id=user_id, org_id=org_id)
        return OrgJoinResponse(
            org=_doc_to_org_public(org_doc),
            membership_state=profile.membership_state,
            role_keys=profile.role_keys,
        )


# ################################ /SERVICE ################################


# ################################ HELPERS ################################
# Internal helper functions for scope resolution and org normalization.
def _scope_resolution_chain(
    *,
    scope_type: ScopeType,
    scope_id: str,
    org_id: str,
) -> list[tuple[ScopeType, str]]:
    chain: list[tuple[ScopeType, str]] = [(scope_type, scope_id)]
    if scope_type != "org":
        chain.append(("org", org_id))
    return chain


def _normalize_slug(value: str) -> str:
    cleaned = value.strip().lower().replace(" ", "-")
    parts = [c for c in cleaned if c.isalnum() or c in {"-", "_"}]
    slug = "".join(parts).strip("-_")
    return slug


def _doc_to_org_public(doc: dict[str, object]) -> OrgPublic:
    return OrgPublic(
        id=str(doc["_id"]),
        slug=str(doc["slug"]),
        name=str(doc["name"]),
        is_active=bool(doc.get("is_active", True)),
        created_at=doc["created_at"],  # type: ignore[arg-type]
        updated_at=doc["updated_at"],  # type: ignore[arg-type]
    )


# ################################ /HELPERS ################################


# ################################ TYPES ################################
# Internal typed structures for role seeding.
class _RoleSeed(TypedDict, total=False):
    role_key: str
    title: str
    permissions: list[str]
    description: str
    membership_state: str
    membership_rank: int


# ################################ /TYPES ################################


# ################################ CONSTANTS ################################
# Default role catalog and permissions seed.
_DEFAULT_ROLES: list[_RoleSeed] = [
    {
        "role_key": "system_admin",
        "title": "System Administrator",
        "permissions": ["system:manage_features"],
        "description": "System-level feature catalog administration.",
        "membership_state": "owner",
        "membership_rank": 6,
    },
    {
        "role_key": "org_owner",
        "title": "Organization Owner",
        "permissions": ["*"],
        "description": "Full access in an organization.",
        "membership_state": "owner",
        "membership_rank": 5,
    },
    {
        "role_key": "org_admin",
        "title": "Organization Admin",
        "permissions": [
            "org:manage",
            "school:manage",
            "school:read",
            "lab:manage",
            "lab:read",
            "content:read",
            "content:write",
            "commerce:manage",
            "community:manage",
            "ai:use",
        ],
        "membership_state": "admin",
        "membership_rank": 4,
    },
    {
        "role_key": "finance_admin",
        "title": "Finance Admin",
        "permissions": ["commerce:manage", "commerce:read"],
        "membership_state": "admin",
        "membership_rank": 4,
    },
    {
        "role_key": "school_admin",
        "title": "School Admin",
        "permissions": ["school:manage", "school:read", "course:manage", "content:read"],
        "membership_state": "admin",
        "membership_rank": 4,
    },
    {
        "role_key": "teacher",
        "title": "Teacher",
        "permissions": ["course:teach", "course:grade", "content:read", "community:write"],
        "membership_state": "staff",
        "membership_rank": 3,
    },
    {
        "role_key": "student",
        "title": "Student",
        "permissions": ["course:learn", "content:read", "community:write", "ai:use"],
        "membership_state": "member",
        "membership_rank": 2,
    },
    {
        "role_key": "parent",
        "title": "Parent",
        "permissions": ["student:read_progress"],
        "membership_state": "member",
        "membership_rank": 2,
    },
    {
        "role_key": "lab_manager",
        "title": "Lab Manager",
        "permissions": ["lab:manage", "lab:read", "lab:bookings:manage"],
        "membership_state": "admin",
        "membership_rank": 4,
    },
    {
        "role_key": "lab_assistant",
        "title": "Lab Assistant",
        "permissions": ["lab:read", "lab:bookings:manage"],
        "membership_state": "staff",
        "membership_rank": 3,
    },
    {
        "role_key": "lab_member",
        "title": "Lab Member",
        "permissions": ["lab:read", "lab:bookings:create"],
        "membership_state": "member",
        "membership_rank": 2,
    },
]
# ################################ /CONSTANTS ################################
