from sqlalchemy.orm import Session
from backend.app.models.news_model import NewsArticle
from backend.app.services.chromadb_service import collection

_model = None


def _get_model():
    global _model
    if _model is None:
        from sentence_transformers import SentenceTransformer
        _model = SentenceTransformer("all-MiniLM-L6-v2")
    return _model


def generate_embedding(text: str):
    return _get_model().encode(text).tolist()


def store_article_embeddings(db: Session):
    articles = db.query(NewsArticle).all()
    for article in articles:
        text = f"{article.title}\n{article.description}"
        embedding = generate_embedding(text)
        article.embedding = embedding
        collection.upsert(
            ids=[str(article.id)],
            embeddings=[embedding],
            documents=[text],
            metadatas=[{"title": article.title, "source": article.source}]
        )
    db.commit()
    return {"message": "Embeddings stored"}