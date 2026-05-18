from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from backend.app.core.database import get_db
from backend.app.services.ingestion_service import fetch_and_store_news

router = APIRouter()


@router.get("/fetch-news")
def fetch_news(db: Session = Depends(get_db)):
    return fetch_and_store_news(db)