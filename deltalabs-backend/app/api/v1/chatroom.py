from fastapi import APIRouter

router = APIRouter(prefix="/chatroom", tags=["chatroom"])


@router.get("")
async def get_chatroom_stub() -> dict[str, str]:
    return {"status": "not_implemented", "module": "chatroom"}
