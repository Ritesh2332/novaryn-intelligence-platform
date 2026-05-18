from sqlalchemy.orm import Session
from sqlalchemy import func

from backend.app.models.news_model import NewsArticle


def get_sentiment_distribution(db: Session):

    results = (
        db.query(
            NewsArticle.sentiment,
            func.count(NewsArticle.id)
        )
        .group_by(NewsArticle.sentiment)
        .all()
    )

    return [
        {
            "sentiment": sentiment,
            "count": count
        }
        for sentiment, count in results
    ]


def get_top_sources(db: Session):

    results = (
        db.query(
            NewsArticle.source,
            func.count(NewsArticle.id)
        )
        .group_by(NewsArticle.source)
        .order_by(func.count(NewsArticle.id).desc())
        .limit(10)
        .all()
    )

    return [
        {
            "source": source,
            "count": count
        }
        for source, count in results
    ]


def get_latest_articles(db: Session):

    articles = (
        db.query(NewsArticle)
        .order_by(NewsArticle.id.desc())
        .limit(10)
        .all()
    )

    return [
        {
            "title": article.title,
            "source": article.source,
            "sentiment": article.sentiment,
            "score": article.sentiment_score,
            "published_at": article.published_at
        }
        for article in articles
    ]