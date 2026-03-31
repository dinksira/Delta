from fastapi import APIRouter

router = APIRouter(prefix="/feed", tags=["feed"])


@router.get("")
async def get_feed_stub() -> dict[str, str]:
    return {"status": "not_implemented", "module": "feed"}
