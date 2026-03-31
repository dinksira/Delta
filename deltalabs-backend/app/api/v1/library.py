from fastapi import APIRouter

router = APIRouter(prefix="/library", tags=["library"])


@router.get("")
async def get_library_stub() -> dict[str, str]:
    return {"status": "not_implemented", "module": "library"}
