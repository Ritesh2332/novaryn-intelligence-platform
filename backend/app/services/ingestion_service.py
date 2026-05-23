import logging
from newsapi import NewsApiClient
from newsapi.newsapi_exception import NewsAPIException
from sqlalchemy.orm import Session
from dotenv import load_dotenv
import os

from backend.app.models.news_model import NewsArticle
from backend.app.services.preprocessing_service import preprocess_text
from backend.app.services.sentiment_service import analyze_sentiment
from backend.app.services.gnews_service import fetch_gnews

logger = logging.getLogger(__name__)

load_dotenv()

NEWS_API_KEY = os.getenv("NEWS_API_KEY")


def _safe_source_name(raw_article):
    source = raw_article.get("source")
    if isinstance(source, dict):
        return source.get("name") or source.get("url") or "Unknown"
    return str(source) if source else "Unknown"


def _safe_get(article, key, default=None):
    value = article.get(key)
    return value if value is not None else default


def fetch_and_store_news(db: Session):
    if not NEWS_API_KEY:
        logger.error("NEWS_API_KEY not configured")
        raise RuntimeError("NEWS_API_KEY environment variable is not set")

    articles = []
    newsapi_error = None

    try:
        newsapi = NewsApiClient(api_key=NEWS_API_KEY)
        response = newsapi.get_top_headlines(language="en", page_size=10)
        articles = response.get("articles", [])
        logger.info(f"NewsAPI returned {len(articles)} articles")
    except NewsAPIException as e:
        newsapi_error = f"NewsAPI error: {e.get_message() if hasattr(e, 'get_message') else str(e)}"
        logger.warning(newsapi_error)
    except Exception as e:
        newsapi_error = f"NewsAPI exception: {str(e)}"
        logger.warning(newsapi_error)

    if not articles:
        try:
            gnews_articles = fetch_gnews()
            if gnews_articles:
                articles = gnews_articles
                logger.info(f"GNews fallback returned {len(articles)} articles")
        except Exception as e:
            logger.warning(f"GNews fallback failed: {e}")

    if not articles:
        raise RuntimeError(
            f"No articles available. {newsapi_error or ''}"
        )

    stored = 0
    skipped = 0

    for raw in articles:
        title = _safe_get(raw, "title")
        url = _safe_get(raw, "url")

        if not title or not url:
            skipped += 1
            continue

        existing = db.query(NewsArticle).filter(NewsArticle.url == url).first()
        if existing:
            skipped += 1
            continue

        raw_content = _safe_get(raw, "content") or _safe_get(raw, "description") or ""
        processed = preprocess_text(raw_content)
        sentiment = analyze_sentiment(processed)

        news = NewsArticle(
            title=title,
            source=_safe_source_name(raw),
            author=_safe_get(raw, "author"),
            description=_safe_get(raw, "description"),
            content=_safe_get(raw, "content"),
            url=url,
            published_at=_safe_get(raw, "publishedAt"),
            sentiment=sentiment["label"],
            sentiment_score=sentiment["score"]
        )

        db.add(news)
        stored += 1

    try:
        db.commit()
    except Exception as e:
        db.rollback()
        logger.error(f"Database commit failed: {e}")
        raise RuntimeError(f"Failed to store articles: {e}")

    return {
        "message": "News analyzed and stored successfully",
        "stored": stored,
        "skipped": skipped
    }