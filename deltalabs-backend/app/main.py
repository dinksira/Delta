from fastapi import FastAPI

from app.core.config import get_settings

_settings = get_settings()

app = FastAPI(
    title=_settings.app_name,
    version=_settings.api_version,
    description=(
        "Delta Labs backend — foundation phase (FastAPI + MongoDB + Redis per backend standards)."
    ),
)
