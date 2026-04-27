from fastapi import APIRouter

# ################################ CONSTANTS ################################
# Router declaration for library module stub.
router = APIRouter(prefix="/library", tags=["library"])
# ################################ /CONSTANTS ################################


# ################################ ROUTES ################################
# Placeholder endpoint until library domain implementation lands.
@router.get("")
async def get_library_stub() -> dict[str, str]:
    return {"status": "not_implemented", "module": "library"}


# ################################ /ROUTES ################################
