"""Smoke tests — verify the application package imports and basic metadata."""

from app.main import app


def test_app_metadata() -> None:
    assert app.title == "Delta Labs API"
    assert app.version == "0.1.0"


# ################################ MODULE ################################
# ################################ /MODULE ################################
