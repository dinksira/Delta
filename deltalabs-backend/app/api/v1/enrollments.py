from fastapi import APIRouter

# ################################ CONSTANTS ################################
# Router declaration for enrollments module stub.
router = APIRouter(prefix="/enrollments", tags=["enrollments"])
# ################################ /CONSTANTS ################################


# ################################ ROUTES ################################
# Placeholder endpoint until enrollments domain implementation lands.
@router.get("")
async def get_enrollments_stub() -> dict[str, str]:
    return {"status": "not_implemented", "module": "enrollments"}


# ################################ /ROUTES ################################
