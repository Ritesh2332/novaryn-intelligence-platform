from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.app.core.database import get_db
from backend.app.services.ingestion_service import fetch_and_store_news

router = APIRouter()


@router.get("/fetch-news")
def fetch_news(db: Session = Depends(get_db)):
    try:
        return fetch_and_store_news(db)
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal error: {str(e)}")