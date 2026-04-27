from fastapi import APIRouter

# ################################ CONSTANTS ################################
# Router declaration for chatroom module stub.
router = APIRouter(prefix="/chatroom", tags=["chatroom"])
# ################################ /CONSTANTS ################################


# ################################ ROUTES ################################
# Placeholder endpoint until chatroom domain implementation lands.
@router.get("")
async def get_chatroom_stub() -> dict[str, str]:
    return {"status": "not_implemented", "module": "chatroom"}


# ################################ /ROUTES ################################
