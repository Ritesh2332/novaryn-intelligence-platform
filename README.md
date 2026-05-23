# Novaryn

A news analysis platform that fetches articles, runs sentiment analysis, and lets you ask questions via a RAG pipeline.

## What's inside

- **Backend:** FastAPI + SQLAlchemy + ChromaDB
- **Frontend:** Flask dashboard
- **ML:** DistilBERT for sentiment, MiniLM for embeddings, Groq for Q&A
- **Infra:** Docker Compose + Jenkins CI/CD + Docker Hub

## Running locally

```bash
# Set your API keys in .env, then:
docker compose up --build
```

Backend runs on `localhost:8000`, frontend on `localhost:5000`.

## API Keys needed

- `NEWS_API_KEY` — for news ingestion
- `GNEWS_API_KEY` — fallback news source
- `GROQ_API_KEY` — for the RAG Q&A
- `HF_TOKEN` — HuggingFace token for model downloads