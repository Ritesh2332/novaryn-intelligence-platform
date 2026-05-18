from sentence_transformers import SentenceTransformer
from sqlalchemy.orm import Session

from backend.app.models.news_model import NewsArticle
from backend.app.services.chromadb_service import collection

model = SentenceTransformer("all-MiniLM-L6-v2")


def generate_embedding(text: str):

    return model.encode(text).tolist()


def store_article_embeddings(db: Session):

    articles = db.query(NewsArticle).all()

    for article in articles:

        text = f"""
        {article.title}
        {article.description}
        """

        embedding = generate_embedding(text)

        # Store in PostgreSQL
        article.embedding = embedding

        # Store in ChromaDB
        collection.upsert(
            ids=[str(article.id)],
            embeddings=[embedding],
            documents=[text],
            metadatas=[
                {
                    "title": article.title,
                    "source": article.source
                }
            ]
        )

    db.commit()

    return {
        "message": "Embeddings stored in PostgreSQL and ChromaDB"
    }