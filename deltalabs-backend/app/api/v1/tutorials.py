from fastapi import APIRouter

# ################################ CONSTANTS ################################
# Router declaration for tutorials module stub.
router = APIRouter(prefix="/tutorials", tags=["tutorials"])
# ################################ /CONSTANTS ################################


# ################################ ROUTES ################################
# Placeholder endpoint until tutorials domain implementation lands.
@router.get("")
async def get_tutorials_stub() -> dict[str, str]:
    return {"status": "not_implemented", "module": "tutorials"}


# ################################ /ROUTES ################################
