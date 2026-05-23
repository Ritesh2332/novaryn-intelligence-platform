"""Tests for main FastAPI app."""


def test_root_endpoint(client):
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["message"] == "Novaryn Backend Running"


def test_docs_endpoint(client):
    response = client.get("/docs")
    assert response.status_code == 200
