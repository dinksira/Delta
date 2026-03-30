from fastapi import FastAPI

app = FastAPI(
    title="Delta Labs API",
    version="0.1.0",
    description=(
        "Delta Labs backend — foundation phase "
        "(FastAPI + MongoDB + Redis per backend standards)."
    ),
)
