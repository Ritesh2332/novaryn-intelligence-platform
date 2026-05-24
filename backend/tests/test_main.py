"""Tests for main FastAPI app."""


def test_health_endpoint(client):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_dashboard_endpoint(client):
    response = client.get("/")
    assert response.status_code == 200
    assert "Novaryn" in response.text


def test_docs_endpoint(client):
    response = client.get("/docs")
    assert response.status_code == 200
