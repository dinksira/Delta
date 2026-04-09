from fastapi import APIRouter

# ################################ CONSTANTS ################################
# Router declaration for certification module stub.
router = APIRouter(prefix="/certification", tags=["certification"])
# ################################ /CONSTANTS ################################


# ################################ ROUTES ################################
# Placeholder endpoint until certification domain implementation lands.
@router.get("")
async def get_certification_stub() -> dict[str, str]:
    return {"status": "not_implemented", "module": "certification"}


# ################################ /ROUTES ################################
