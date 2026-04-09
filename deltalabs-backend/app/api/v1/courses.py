from fastapi import APIRouter

# ################################ CONSTANTS ################################
# Router declaration for courses module stub.
router = APIRouter(prefix="/courses", tags=["courses"])
# ################################ /CONSTANTS ################################


# ################################ ROUTES ################################
# Placeholder endpoint until courses domain implementation lands.
@router.get("")
async def get_courses_stub() -> dict[str, str]:
    return {"status": "not_implemented", "module": "courses"}


# ################################ /ROUTES ################################
