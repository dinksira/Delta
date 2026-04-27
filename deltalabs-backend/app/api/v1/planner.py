from fastapi import APIRouter

# ################################ CONSTANTS ################################
# Router declaration for planner module stub.
router = APIRouter(prefix="/planner", tags=["planner"])
# ################################ /CONSTANTS ################################


# ################################ ROUTES ################################
# Placeholder endpoint until planner domain implementation lands.
@router.get("")
async def get_planner_stub() -> dict[str, str]:
    return {"status": "not_implemented", "module": "planner"}


# ################################ /ROUTES ################################
