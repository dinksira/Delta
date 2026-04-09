from fastapi import APIRouter

# ################################ CONSTANTS ################################
# Router declaration for help_support module stub.
router = APIRouter(prefix="/help_support", tags=["help_support"])
# ################################ /CONSTANTS ################################


# ################################ ROUTES ################################
# Placeholder endpoint until help_support domain implementation lands.
@router.get("")
async def get_help_support_stub() -> dict[str, str]:
    return {"status": "not_implemented", "module": "help_support"}


# ################################ /ROUTES ################################
