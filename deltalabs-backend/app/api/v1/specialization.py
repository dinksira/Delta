from fastapi import APIRouter

router = APIRouter(prefix="/specialization", tags=["specialization"])


@router.get("")
async def get_specialization_stub() -> dict[str, str]:
    return {"status": "not_implemented", "module": "specialization"}
