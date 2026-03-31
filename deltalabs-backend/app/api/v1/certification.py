from fastapi import APIRouter

router = APIRouter(prefix="/certification", tags=["certification"])


@router.get("")
async def get_certification_stub() -> dict[str, str]:
    return {"status": "not_implemented", "module": "certification"}
