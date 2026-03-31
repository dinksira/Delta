from fastapi import APIRouter

router = APIRouter(prefix="/enrollments", tags=["enrollments"])


@router.get("")
async def get_enrollments_stub() -> dict[str, str]:
    return {"status": "not_implemented", "module": "enrollments"}
