from fastapi import APIRouter

router = APIRouter(prefix="/help_support", tags=["help_support"])


@router.get("")
async def get_help_support_stub() -> dict[str, str]:
    return {"status": "not_implemented", "module": "help_support"}
