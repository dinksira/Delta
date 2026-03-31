"""Worker process placeholders.

Queue backend decision (Celery/ARQ/RQ) is intentionally deferred from foundation.
"""


def worker_health() -> dict[str, str]:
    """Return worker baseline status for smoke/integration checks."""
    return {"status": "not_configured"}
