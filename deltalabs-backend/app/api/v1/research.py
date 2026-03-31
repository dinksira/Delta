from fastapi import APIRouter

router = APIRouter(prefix="/research", tags=["research"])


@router.get("")
async def get_research_stub() -> dict[str, str]:
    return {"status": "not_implemented", "module": "research"}
