from fastapi import APIRouter
from sqlalchemy import func

from backend.app.core.database import SessionLocal
from backend.app.models.news_model import NewsArticle

router = APIRouter(
    prefix="/analytics",
    tags=["Analytics"]
)


@router.get("/sentiment-distribution")
def sentiment_distribution():

    db = SessionLocal()

    try:

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

    finally:

        db.close()


@router.get("/top-sources")
def top_sources():

    db = SessionLocal()

    try:

        results = (

            db.query(
                NewsArticle.source,
                func.count(NewsArticle.id)
            )

            .group_by(NewsArticle.source)

            .order_by(
                func.count(NewsArticle.id).desc()
            )

            .limit(5)

            .all()

        )

        return [

            {
                "source": source,
                "count": count
            }

            for source, count in results

        ]

    finally:

        db.close()


@router.get("/latest-articles")
def latest_articles():

    db = SessionLocal()

    try:

        articles = (

            db.query(NewsArticle)

            .order_by(
                NewsArticle.id.desc()
            )

            .limit(10)

            .all()

        )

        return [

            {
                "title": article.title,
                "description": article.description,
                "source": article.source,
                "sentiment": article.sentiment
            }

            for article in articles

        ]

    finally:

        db.close()