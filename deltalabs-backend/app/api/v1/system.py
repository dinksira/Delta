from fastapi import APIRouter

router = APIRouter(prefix="/system", tags=["system"])


@router.get("/status")
async def system_status() -> dict[str, str]:
    return {"status": "ok"}
