from fastapi import APIRouter

# ################################ CONSTANTS ################################
# Router declaration for course_support module stub.
router = APIRouter(prefix="/course_support", tags=["course_support"])
# ################################ /CONSTANTS ################################


# ################################ ROUTES ################################
# Placeholder endpoint until course_support domain implementation lands.
@router.get("")
async def get_course_support_stub() -> dict[str, str]:
    return {"status": "not_implemented", "module": "course_support"}


# ################################ /ROUTES ################################
