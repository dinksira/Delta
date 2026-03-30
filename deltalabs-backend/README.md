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

