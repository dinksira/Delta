"""Authorization dependencies for path-scoped routes."""

from __future__ import annotations

from collections.abc import Awaitable, Callable
from typing import Literal

from fastapi import Depends, HTTPException, Request, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.api.deps import CurrentUser, get_current_user, get_db
from app.core.exceptions import PermissionDeniedError
from app.domain.authorization.repository import Repository as AuthzRepository
from app.domain.authorization.schemas import PermissionCheckRequest
from app.domain.authorization.service import Service as AuthorizationService


# ################################ HELPERS ################################
# Shared authz service construction and membership guard dependencies.
def _authorization_service(db: AsyncIOMotorDatabase[dict[str, object]]) -> AuthorizationService:
    return AuthorizationService(AuthzRepository(db))


async def get_authorization_service(
    db: AsyncIOMotorDatabase[dict[str, object]] = Depends(get_db),  # noqa: B008
) -> AuthorizationService:
    service = _authorization_service(db)
    await service.bootstrap_defaults()
    return service


async def require_org_membership(
    org_id: str,
    user: CurrentUser = Depends(get_current_user),  # noqa: B008
    authz: AuthorizationService = Depends(get_authorization_service),  # noqa: B008
) -> None:
    profile = await authz.get_access_profile(user_id=user.user_id, org_id=org_id)
    if profile.membership_state == "none":
        raise PermissionDeniedError(
            "You are not a member of this organization.",
            code="org_membership_required",
            details={"orgId": org_id},
        )


# ################################ /HELPERS ################################


# ################################ DEPENDENCIES ################################
# Permission-check dependency factory for path-scoped routes.
def require_org_permission(
    permission: str,
    *,
    scope_type: Literal["org", "school", "lab", "course", "global"] = "org",
    scope_id_param: str | None = None,
    resource_owner_param: str | None = None,
) -> Callable[..., Awaitable[None]]:
    """Create a dependency that checks a permission for path-scoped org routes."""

    async def _dependency(
        request: Request,
        user: CurrentUser = Depends(get_current_user),  # noqa: B008
        authz: AuthorizationService = Depends(get_authorization_service),  # noqa: B008
    ) -> None:
        org_id = request.path_params.get("org_id")
        if not isinstance(org_id, str) or not org_id.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"code": "missing_org_scope", "message": "Missing org_id path scope."},
            )
        if scope_id_param is None:
            scope_id = org_id
        else:
            raw_scope = request.path_params.get(scope_id_param)
            if not isinstance(raw_scope, str) or not raw_scope.strip():
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail={
                        "code": "missing_scope_id",
                        "message": f"Missing required path param '{scope_id_param}'.",
                    },
                )
            scope_id = raw_scope

        resource_owner_user_id: str | None = None
        if resource_owner_param is not None:
            owner = request.path_params.get(resource_owner_param)
            if isinstance(owner, str) and owner.strip():
                resource_owner_user_id = owner

        await authz.require_permission(
            user_id=user.user_id,
            payload=PermissionCheckRequest(
                org_id=org_id,
                permission=permission,
                scope_type=scope_type,
                scope_id=scope_id,
                resource_owner_user_id=resource_owner_user_id,
            ),
        )

    return _dependency


# ################################ /DEPENDENCIES ################################
