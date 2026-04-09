"""Unit tests for feed cursor encoding."""

from datetime import UTC, datetime

from app.domain.content.repository import decode_feed_cursor, encode_feed_cursor


def test_feed_cursor_roundtrip() -> None:
    dt = datetime(2025, 1, 15, 12, 0, 0, tzinfo=UTC)
    token = encode_feed_cursor(created_at=dt, item_id="c5")
    decoded = decode_feed_cursor(token)
    assert decoded is not None
    t2, i2 = decoded
    assert i2 == "c5"
    assert t2.isoformat() == dt.isoformat()


def test_feed_cursor_invalid_returns_none() -> None:
    assert decode_feed_cursor("not-a-valid-cursor") is None


# ################################ MODULE ################################
# ################################ /MODULE ################################
