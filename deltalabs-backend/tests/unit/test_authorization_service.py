from __future__ import annotations

from app.domain.authorization.schemas import PermissionCheckRequest
from app.domain.authorization.service import Service


# ################################ MODULE ################################
class _Repo:
    def __init__(self) -> None:
        self.memberships = {("org-a", "user-1")}
        self.bindings = [
            {
                "org_id": "org-a",
                "subject_user_id": "user-1",
                "scope_type": "org",
                "scope_id": "org-a",
                "role_key": "teacher",
            }
        ]
        self.definitions = [
            {
                "role_key": "teacher",
                "permissions": ["course:teach", "content:read"],
            }
        ]
        self.relationships = {("org-a", "parent_of", "user-2", "student-1")}

    async def ensure_indexes(self) -> None:
        return None

    async def upsert_default_org(self, *, slug: str, name: str) -> dict[str, object]:
        return {"slug": slug, "name": name}

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
        _ = role_key
        _ = title
        _ = permissions
        _ = description
        _ = membership_state
        _ = membership_rank
        return None

    async def find_membership(self, *, org_id: str, user_id: str) -> dict[str, str] | None:
        if (org_id, user_id) in self.memberships:
            return {"org_id": org_id, "user_id": user_id}
        return None

    async def list_role_bindings(
        self,
        *,
        org_id: str,
        user_id: str,
        scope_pairs: list[tuple[str, str]],
    ) -> list[dict[str, str]]:
        return [
            row
            for row in self.bindings
            if row["org_id"] == org_id
            and row["subject_user_id"] == user_id
            and (row["scope_type"], row["scope_id"]) in scope_pairs
        ]

    async def list_role_definitions_for_keys(self, role_keys: list[str]) -> list[dict[str, object]]:
        return [row for row in self.definitions if row["role_key"] in role_keys]

    async def list_role_bindings_for_user_in_org(
        self,
        *,
        org_id: str,
        user_id: str,
    ) -> list[dict[str, str]]:
        return [
            row
            for row in self.bindings
            if row["org_id"] == org_id and row["subject_user_id"] == user_id
        ]

    async def has_relationship(
        self,
        *,
        org_id: str,
        relation: str,
        from_user_id: str,
        to_user_id: str,
    ) -> bool:
        return (org_id, relation, from_user_id, to_user_id) in self.relationships


async def test_authorize_allows_role_permission() -> None:
    service = Service(_Repo())
    decision = await service.authorize(
        user_id="user-1",
        payload=PermissionCheckRequest(
            org_id="org-a",
            permission="course:teach",
            scope_type="org",
            scope_id="org-a",
        ),
    )
    assert decision.allowed is True


async def test_authorize_denies_without_membership() -> None:
    service = Service(_Repo())
    decision = await service.authorize(
        user_id="user-x",
        payload=PermissionCheckRequest(
            org_id="org-a",
            permission="course:teach",
            scope_type="org",
            scope_id="org-a",
        ),
    )
    assert decision.allowed is False
    assert decision.reason == "missing_org_membership"


async def test_authorize_allows_relationship_fallback() -> None:
    repo = _Repo()
    repo.memberships.add(("org-a", "user-2"))
    service = Service(repo)
    decision = await service.authorize(
        user_id="user-2",
        payload=PermissionCheckRequest(
            org_id="org-a",
            permission="student:read_progress",
            scope_type="school",
            scope_id="school-7",
            resource_owner_user_id="student-1",
        ),
    )
    assert decision.allowed is True
    assert decision.reason == "relationship_parent_of"


# ################################ /MODULE ################################
