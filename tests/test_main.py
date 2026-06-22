from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_root():
    response = client.get("/")
    assert response.status_code == 200
    assert "text/html" in response.headers.get("content-type", "")
    assert "<!DOCTYPE html" in response.text or "Todo App" in response.text


def test_404_unknown_route_returns_html():
    response = client.get("/this-does-not-exist")
    assert response.status_code == 404
    assert "text/html" in response.headers.get("content-type", "")
    assert "404" in response.text


def test_404_health_returns_html():
    response = client.get("/health")
    assert response.status_code == 404
    assert "text/html" in response.headers.get("content-type", "")


def test_404_api_prefix_returns_json():
    response = client.get("/auth/nonexistent")
    assert response.status_code == 404
    assert response.json() == {"detail": "Not found"}