# Backend (FastAPI)

## Run locally

```bash
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -e ".[dev]"
uvicorn app.main:app --reload
```

## Quality checks

```bash
ruff check app tests
ruff format --check app tests
mypy app tests
pytest
```

## Environment

Copy `.env.example` to `.env` and adjust values for your local stack.
Core foundation variables include:

- `MONGODB_URI`, `MONGODB_DB_NAME`
- `REDIS_URL`
- `API_V1_PREFIX`
- `CORS_ORIGINS`
- `IDEMPOTENCY_HEADER_NAME`, `IDEMPOTENCY_TTL_SECONDS` (foundation scaffold)
- `LOG_LEVEL`

## Testing layout

- `tests/unit`: isolated unit checks
- `tests/integration`: request/response integration checks

