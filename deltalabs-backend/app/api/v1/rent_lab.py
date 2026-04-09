from fastapi import APIRouter, Depends

from app.api.deps_authz import require_org_permission

# ################################ CONSTANTS ################################
# Router declarations for rent_lab compatibility and org-scoped stubs.
router = APIRouter(prefix="/rent_lab", tags=["rent_lab"])
org_router = APIRouter(prefix="/orgs/{org_id}/labs", tags=["rent_lab"])
# ################################ /CONSTANTS ################################


# ################################ ROUTES ################################
# Placeholder routes until rent_lab domain implementation lands.
@router.get("")
async def get_rent_lab_stub() -> dict[str, str]:
    return {"status": "not_implemented", "module": "rent_lab"}


@org_router.get(
    "",
    dependencies=[Depends(require_org_permission("lab:read", scope_type="org"))],
)
async def get_org_labs_stub(org_id: str) -> dict[str, str]:
    return {"status": "not_implemented", "module": "rent_lab", "org_id": org_id}


# ################################ /ROUTES ################################
