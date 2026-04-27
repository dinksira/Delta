from fastapi import APIRouter

# ################################ CONSTANTS ################################
# Router declaration for competitions module stub.
router = APIRouter(prefix="/competitions", tags=["competitions"])
# ################################ /CONSTANTS ################################


# ################################ ROUTES ################################
# Placeholder endpoint until competitions domain implementation lands.
@router.get("")
async def get_competitions_stub() -> dict[str, str]:
    return {"status": "not_implemented", "module": "competitions"}


# ################################ /ROUTES ################################
