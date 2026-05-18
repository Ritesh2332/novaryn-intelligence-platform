from fastapi import FastAPI
from backend.app.core.database import engine, Base

# IMPORTANT: import models BEFORE create_all
from backend.app.models.news_model import NewsArticle
from backend.app.api.routes.news import router as news_router
from backend.app.api.routes.analytics import router as analytics_router

app = FastAPI(title="Novaryn AI Platform")


Base.metadata.create_all(bind=engine)

app.include_router(news_router)
app.include_router(analytics_router)

@app.get("/")
def home():
    return {"message": "Novaryn Backend Running"}