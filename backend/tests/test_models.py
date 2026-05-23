"""Tests for database models."""

from backend.app.models.news_model import NewsArticle


def test_article_defaults(db_session):
    article = NewsArticle(
        title="Minimal Article",
        url="https://example.com/minimal"
    )
    db_session.add(article)
    db_session.commit()

    result = db_session.query(NewsArticle).first()
    assert result.sentiment == "neutral"
    assert result.sentiment_score == 0.0
    assert result.title == "Minimal Article"


def test_nullable_title(db_session):
    article = NewsArticle(
        title=None,
        url="https://example.com/no-title"
    )
    db_session.add(article)
    db_session.commit()

    result = db_session.query(NewsArticle).first()
    assert result.title is None


import pytest
from sqlalchemy.exc import IntegrityError


def test_unique_url_constraint(db_session):
    db_session.add(NewsArticle(title="First", url="https://example.com/dup"))
    db_session.commit()

    db_session.add(NewsArticle(title="Second", url="https://example.com/dup"))
    with pytest.raises(IntegrityError):
        db_session.commit()
