import requests
import os

from dotenv import load_dotenv

load_dotenv()

GNEWS_API_KEY = os.getenv("GNEWS_API_KEY")


def fetch_gnews():

    topics = [
    "world",
    "nation",
    "business",
    "technology",
    "entertainment",
    "sports",
    "science",
    "health"
    ]

    all_articles = []

    for topic in topics:

        url = "https://gnews.io/api/v4/top-headlines"

        params = {
            "token": GNEWS_API_KEY,
            "lang": "en",
            "topic": topic,
            "max": 10
        }

        response = requests.get(url, params=params)

        data = response.json()

        all_articles.extend(
            data.get("articles", [])
        )

    return all_articles