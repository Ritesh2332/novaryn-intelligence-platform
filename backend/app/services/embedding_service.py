import os
import time
import requests
from sqlalchemy.orm import Session
from backend.app.models.news_model import NewsArticle
from backend.app.services.chromadb_service import collection

API_URL = "https://api-inference.huggingface.co/pipeline/feature-extraction/sentence-transformers/all-MiniLM-L6-v2"

def generate_embedding(text: str):
    headers = {"Authorization": f"Bearer {os.getenv('HF_API_KEY')}"}
    payload = {"inputs": text}
    
    for _ in range(3):
        response = requests.post(API_URL, headers=headers, json=payload)
        if response.status_code == 200:
            # Depending on the API, it might return a list of lists or just a list
            result = response.json()
            if isinstance(result, list) and isinstance(result[0], list):
                return result[0]
            return result
        
        try:
            error_data = response.json()
            if 'estimated_time' in error_data:
                time.sleep(error_data['estimated_time'] + 1)
            else:
                time.sleep(2)
        except:
            time.sleep(2)
            
    # Fallback vector if API fails
    return [0.0] * 384

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