from newsapi import NewsApiClient
from sqlalchemy.orm import Session
from dotenv import load_dotenv
import os

from backend.app.models.news_model import NewsArticle

from backend.app.services.preprocessing_service import preprocess_text
from backend.app.services.sentiment_service import analyze_sentiment

load_dotenv()

newsapi = NewsApiClient(
    api_key=os.getenv("NEWS_API_KEY")
)


def fetch_and_store_news(db: Session):

    articles = newsapi.get_top_headlines(
        language="en",
        page_size=10
    )

    for article in articles["articles"]:

        existing_article = db.query(NewsArticle).filter(
            NewsArticle.url == article.get("url")
        ).first()

        if existing_article:
            continue

        raw_content = article.get("content")

        processed_text = preprocess_text(raw_content)

        sentiment_result = analyze_sentiment(processed_text)



        news = NewsArticle(
            title=article.get("title"),
            source=article["source"]["name"],
            author=article.get("author"),
            description=article.get("description"),
            content=raw_content,
            url=article.get("url"),
            published_at=article.get("publishedAt"),
            sentiment=sentiment_result["label"],
            sentiment_score=sentiment_result["score"]
        )

        db.add(news)

    db.commit()

    return {
        "message": "News analyzed and stored successfully"
    }