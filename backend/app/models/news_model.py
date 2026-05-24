from sqlalchemy import Column, Integer, String, Text, Float
from backend.app.core.database import Base

class NewsArticle(Base):
    __tablename__ = "news_articles"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=True)
    source = Column(String)
    author = Column(String)
    description = Column(Text)
    content = Column(Text)
    url = Column(String, unique=True)
    published_at = Column(String)
    sentiment = Column(String, default="neutral")
    sentiment_score = Column(Float, default=0.0)