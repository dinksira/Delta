from fastapi import APIRouter

router = APIRouter(prefix="/auth", tags=["auth"])


@router.get("")
async def get_auth_stub() -> dict[str, str]:
    return {"status": "not_implemented", "module": "auth"}
