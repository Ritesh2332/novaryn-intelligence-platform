import logging
import requests
import os
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)
GNEWS_API_KEY = os.getenv("GNEWS_API_KEY")


def fetch_gnews():
    if not GNEWS_API_KEY:
        logger.warning("GNEWS_API_KEY not configured")
        return []

    topics = ["world", "nation", "business", "technology", "entertainment", "sports", "science", "health"]
    all_articles = []

    for topic in topics:
        url = "https://gnews.io/api/v4/top-headlines"
        params = {"token": GNEWS_API_KEY, "lang": "en", "topic": topic, "max": 10}

        try:
            response = requests.get(url, params=params, timeout=15)
            response.raise_for_status()
            data = response.json()
            all_articles.extend(data.get("articles", []))
        except requests.exceptions.RequestException as e:
            logger.warning(f"GNews request failed for topic '{topic}': {e}")
        except Exception as e:
            logger.warning(f"GNews parse error for topic '{topic}': {e}")

    logger.info(f"GNews fetched {len(all_articles)} total articles")
    return all_articles