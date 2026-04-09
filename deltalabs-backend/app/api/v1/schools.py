from fastapi import APIRouter, Depends

from app.api.deps_authz import require_org_permission

# ################################ CONSTANTS ################################
# Router declarations for schools compatibility and org-scoped stubs.
router = APIRouter(prefix="/schools", tags=["schools"])
org_router = APIRouter(prefix="/orgs/{org_id}/schools", tags=["schools"])
# ################################ /CONSTANTS ################################


# ################################ ROUTES ################################
# Placeholder routes until school domain implementation lands.
@router.get("")
async def get_schools_stub() -> dict[str, str]:
    return {"status": "not_implemented", "module": "schools"}


@org_router.get(
    "",
    dependencies=[Depends(require_org_permission("school:read", scope_type="org"))],
)
async def get_org_schools_stub(org_id: str) -> dict[str, str]:
    return {"status": "not_implemented", "module": "schools", "org_id": org_id}


# ################################ /ROUTES ################################
