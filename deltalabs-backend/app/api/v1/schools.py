from fastapi import APIRouter

router = APIRouter(prefix="/schools", tags=["schools"])


@router.get("")
async def get_schools_stub() -> dict[str, str]:
    return {"status": "not_implemented", "module": "schools"}
