from typing import Any

from fastapi import APIRouter

from app.core import metrics as http_metrics

# ################################ CONSTANTS ################################
# Router declaration for system operational endpoints.
router = APIRouter(prefix="/system", tags=["system"])
# ################################ /CONSTANTS ################################


# ################################ ROUTES ################################
# Status and lightweight metrics endpoints.
@router.get("/status")
async def system_status() -> dict[str, str]:
    return {"status": "ok"}


@router.get("/metrics")
async def system_metrics() -> dict[str, Any]:
    """Lightweight request counters (see also structured logs)."""
    return http_metrics.snapshot()


# ################################ /ROUTES ################################
