from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.app.core.database import engine, Base
from backend.app.models.news_model import NewsArticle
from backend.app.api.routes.news import router as news_router
from backend.app.api.routes.analytics import router as analytics_router
from backend.app.api.routes.rag import router as rag_router

app = FastAPI(title="Novaryn AI Platform")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

Base.metadata.create_all(bind=engine)
app.include_router(news_router)
app.include_router(analytics_router)
app.include_router(rag_router)

@app.get("/")
def home():
    return {"message": "Novaryn Backend Running"}