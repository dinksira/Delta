from fastapi import APIRouter

router = APIRouter(prefix="/rent_lab", tags=["rent_lab"])


@router.get("")
async def get_rent_lab_stub() -> dict[str, str]:
    return {"status": "not_implemented", "module": "rent_lab"}
