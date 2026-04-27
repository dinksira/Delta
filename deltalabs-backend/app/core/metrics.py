"""Process-local HTTP counters for operational visibility (not a full metrics stack)."""

from __future__ import annotations

import threading
from typing import Any

_lock = threading.Lock()
_requests_total: int = 0
_status_counts: dict[int, int] = {}


def record_request(*, status_code: int) -> None:
    """Increment totals after a response is produced."""
    # ################################ METRICS ################################
    global _requests_total
    with _lock:
        _requests_total += 1
        _status_counts[status_code] = _status_counts.get(status_code, 0) + 1


def snapshot() -> dict[str, Any]:
    """Return a shallow copy suitable for JSON responses."""
    with _lock:
        return {
            "requests_total": _requests_total,
            "responses_by_status": dict(_status_counts),
        }


# ################################ /METRICS ################################
