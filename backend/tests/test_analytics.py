"""Tests for analytics endpoints."""

from backend.app.models.news_model import NewsArticle


def test_sentiment_distribution_empty(client, db_session):
    response = client.get("/analytics/sentiment-distribution")
    assert response.status_code == 200
    assert response.json() == []


def test_sentiment_distribution_with_data(client, db_session):
    db_session.add_all([
        NewsArticle(title="A", source="S1", url="http://a.com", sentiment="positive"),
        NewsArticle(title="B", source="S2", url="http://b.com", sentiment="positive"),
        NewsArticle(title="C", source="S3", url="http://c.com", sentiment="negative"),
    ])
    db_session.commit()

    response = client.get("/analytics/sentiment-distribution")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2
    sentiments = {item["sentiment"]: item["count"] for item in data}
    assert sentiments["positive"] == 2
    assert sentiments["negative"] == 1


def test_top_sources_empty(client, db_session):
    response = client.get("/analytics/top-sources")
    assert response.status_code == 200
    assert response.json() == []


def test_top_sources_with_data(client, db_session):
    db_session.add_all([
        NewsArticle(title="A", source="BBC", url="http://a.com"),
        NewsArticle(title="B", source="BBC", url="http://b.com"),
        NewsArticle(title="C", source="CNN", url="http://c.com"),
    ])
    db_session.commit()

    response = client.get("/analytics/top-sources")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2
    assert data[0]["source"] == "BBC"
    assert data[0]["count"] == 2


def test_latest_articles_empty(client, db_session):
    response = client.get("/analytics/latest-articles")
    assert response.status_code == 200
    assert response.json() == []


def test_latest_articles_with_data(client, db_session):
    db_session.add_all([
        NewsArticle(title="Old", source="S", url="http://old.com"),
        NewsArticle(title="New", source="S", url="http://new.com"),
    ])
    db_session.commit()

    response = client.get("/analytics/latest-articles")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2
    assert data[0]["title"] == "New"
