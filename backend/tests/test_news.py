"""Tests for news endpoints."""

from unittest.mock import patch

from backend.app.models.news_model import NewsArticle


def test_fetch_news_success(client, db_session):
    with patch(
        "backend.app.api.routes.news.fetch_and_store_news"
    ) as mock_fetch:
        mock_fetch.return_value = {
            "message": "News analyzed and stored successfully",
            "stored": 5,
            "skipped": 0
        }
        response = client.get("/fetch-news")
        assert response.status_code == 200
        assert response.json()["stored"] == 5
        mock_fetch.assert_called_once()


def test_fetch_news_service_error(client, db_session):
    with patch(
        "backend.app.api.routes.news.fetch_and_store_news"
    ) as mock_fetch:
        mock_fetch.side_effect = RuntimeError("API limit exceeded")
        response = client.get("/fetch-news")
        assert response.status_code == 503
        assert "API limit exceeded" in response.json()["detail"]


def test_fetch_news_generic_error(client, db_session):
    with patch(
        "backend.app.api.routes.news.fetch_and_store_news"
    ) as mock_fetch:
        mock_fetch.side_effect = Exception("Unexpected failure")
        response = client.get("/fetch-news")
        assert response.status_code == 500
        assert "Unexpected failure" in response.json()["detail"]


def test_news_model_create(db_session):
    article = NewsArticle(
        title="Test Article",
        source="Test Source",
        url="https://example.com/test",
        sentiment="positive",
        sentiment_score=0.85
    )
    db_session.add(article)
    db_session.commit()

    result = db_session.query(NewsArticle).filter_by(url="https://example.com/test").first()
    assert result is not None
    assert result.title == "Test Article"
    assert result.sentiment == "positive"
