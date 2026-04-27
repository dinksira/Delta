"""Structured logging baseline for foundation phase."""

from __future__ import annotations

import json
import logging
import sys
from datetime import UTC, datetime
from typing import Any


class JsonFormatter(logging.Formatter):
    """Very small JSON formatter for structured app logs."""

    # ################################ LOGGING ################################
    def format(self, record: logging.LogRecord) -> str:
        payload: dict[str, Any] = {
            "timestamp": datetime.now(UTC).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
        }

        request_id = getattr(record, "request_id", None)
        if isinstance(request_id, str) and request_id:
            payload["request_id"] = request_id

        status_code = getattr(record, "status_code", None)
        if isinstance(status_code, int):
            payload["status_code"] = status_code

        duration_ms = getattr(record, "duration_ms", None)
        if isinstance(duration_ms, int):
            payload["duration_ms"] = duration_ms

        path = getattr(record, "path", None)
        if isinstance(path, str):
            payload["path"] = path

        method = getattr(record, "method", None)
        if isinstance(method, str):
            payload["method"] = method

        return json.dumps(payload, separators=(",", ":"))


def configure_logging(log_level: str) -> None:
    """Set app-wide root logger output format and level."""
    level = getattr(logging, log_level.upper(), logging.INFO)
    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(JsonFormatter())

    root_logger = logging.getLogger()
    root_logger.handlers.clear()
    root_logger.addHandler(handler)
    root_logger.setLevel(level)


# ################################ /LOGGING ################################
