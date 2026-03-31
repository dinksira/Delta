from fastapi import APIRouter

router = APIRouter(prefix="/courses", tags=["courses"])


@router.get("")
async def get_courses_stub() -> dict[str, str]:
    return {"status": "not_implemented", "module": "courses"}
