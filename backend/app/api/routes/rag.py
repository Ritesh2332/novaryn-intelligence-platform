from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from backend.app.core.database import get_db

from backend.app.services.embedding_service import (
    store_article_embeddings
)

from backend.app.services.rag_service import (
    generate_rag_answer
)

router = APIRouter(prefix="/rag")


@router.post("/generate-embeddings")
def generate_embeddings(
    db: Session = Depends(get_db)
):
    return store_article_embeddings(db)


@router.get("/ask")
def ask_question(query: str):

    return generate_rag_answer(query)