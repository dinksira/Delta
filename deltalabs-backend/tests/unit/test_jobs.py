"""Unit tests for jobs worker helpers."""

from app.jobs.workers import worker_health


def test_worker_health_placeholder() -> None:
    assert worker_health() == {"status": "stream_fanout_ready"}


# ################################ MODULE ################################
# ################################ /MODULE ################################
