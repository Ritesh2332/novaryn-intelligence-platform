from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from backend.app.core.database import get_db

from backend.app.services.analytics_service import (
    get_sentiment_distribution,
    get_top_sources,
    get_latest_articles
)

router = APIRouter(prefix="/analytics")


@router.get("/sentiment-distribution")
def sentiment_distribution(
    db: Session = Depends(get_db)
):
    return get_sentiment_distribution(db)


@router.get("/top-sources")
def top_sources(
    db: Session = Depends(get_db)
):
    return get_top_sources(db)


@router.get("/latest-articles")
def latest_articles(
    db: Session = Depends(get_db)
):
    return get_latest_articles(db)