from fastapi import APIRouter

router = APIRouter(prefix="/planner", tags=["planner"])


@router.get("")
async def get_planner_stub() -> dict[str, str]:
    return {"status": "not_implemented", "module": "planner"}
