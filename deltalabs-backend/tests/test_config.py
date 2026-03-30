"""Settings load from environment without requiring live DB/Redis."""

import pytest
from app.core.config import Settings, get_settings


@pytest.fixture(autouse=True)
def clear_settings_cache() -> None:
    get_settings.cache_clear()
    yield
    get_settings.cache_clear()


def test_default_settings() -> None:
    s = Settings()
    assert s.mongodb_uri.startswith("mongodb://")
    assert s.mongodb_db_name == "deltalabs"
    assert s.redis_url.startswith("redis://")
    assert s.api_v1_prefix == "/v1"
    assert s.env == "local"
    assert s.cors_origin_list() == ["http://localhost:3000"]


def test_cors_origin_list_multiple() -> None:
    s = Settings(cors_origins="http://a:1, http://b:2 ,,")
    assert s.cors_origin_list() == ["http://a:1", "http://b:2"]


def test_env_overrides(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("MONGODB_URI", "mongodb://custom:27017")
    monkeypatch.setenv("ENV", "staging")
    s = Settings()
    assert s.mongodb_uri == "mongodb://custom:27017"
    assert s.env == "staging"
