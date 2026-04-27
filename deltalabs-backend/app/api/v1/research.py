from fastapi import APIRouter

# ################################ CONSTANTS ################################
# Router declaration for research module stub.
router = APIRouter(prefix="/research", tags=["research"])
# ################################ /CONSTANTS ################################


# ################################ ROUTES ################################
# Placeholder endpoint until research domain implementation lands.
@router.get("")
async def get_research_stub() -> dict[str, str]:
    return {"status": "not_implemented", "module": "research"}


# ################################ /ROUTES ################################
