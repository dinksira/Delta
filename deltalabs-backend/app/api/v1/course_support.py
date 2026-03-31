from fastapi import APIRouter

router = APIRouter(prefix="/course_support", tags=["course_support"])


@router.get("")
async def get_course_support_stub() -> dict[str, str]:
    return {"status": "not_implemented", "module": "course_support"}
