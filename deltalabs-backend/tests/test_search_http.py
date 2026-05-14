"""HTTP tests for global search endpoint."""

from app.main import app
from fastapi.testclient import TestClient


def test_search_empty_query_returns_shape() -> None:
    with TestClient(app) as client:
        response = client.get("/v1/search?q=")
    assert response.status_code == 200
    body = response.json()
    assert body["q"] == ""
    assert body["users"] == []
    assert body["videos"] == []
    assert body["audio"] == []
    assert body["simulations"] == []
    assert "algorithm_version" in body


def test_search_nonempty_returns_buckets() -> None:
    with TestClient(app) as client:
        response = client.get("/v1/search?q=DeltaLabs&tab=top&limit=5")
    assert response.status_code == 200
    body = response.json()
    assert body["q"] == "DeltaLabs"
    assert isinstance(body["videos"], list)
    assert isinstance(body["users"], list)
