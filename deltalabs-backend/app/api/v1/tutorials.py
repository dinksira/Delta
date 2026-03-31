from fastapi import APIRouter

router = APIRouter(prefix="/tutorials", tags=["tutorials"])


@router.get("")
async def get_tutorials_stub() -> dict[str, str]:
    return {"status": "not_implemented", "module": "tutorials"}
