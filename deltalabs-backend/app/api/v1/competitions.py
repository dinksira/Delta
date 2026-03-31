from fastapi import APIRouter

router = APIRouter(prefix="/competitions", tags=["competitions"])


@router.get("")
async def get_competitions_stub() -> dict[str, str]:
    return {"status": "not_implemented", "module": "competitions"}
