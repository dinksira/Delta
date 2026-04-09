from fastapi import APIRouter

# ################################ CONSTANTS ################################
# Router declaration for specialization module stub.
router = APIRouter(prefix="/specialization", tags=["specialization"])
# ################################ /CONSTANTS ################################


# ################################ ROUTES ################################
# Placeholder endpoint until specialization domain implementation lands.
@router.get("")
async def get_specialization_stub() -> dict[str, str]:
    return {"status": "not_implemented", "module": "specialization"}


# ################################ /ROUTES ################################
