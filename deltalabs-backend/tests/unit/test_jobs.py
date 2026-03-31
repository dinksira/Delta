"""Unit tests for jobs placeholder."""

from app.jobs.workers import worker_health


def test_worker_health_placeholder() -> None:
    assert worker_health() == {"status": "not_configured"}
