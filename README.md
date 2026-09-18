# novaryn ai

a lightweight, serverless project that got out of hand - real-time news ingestion, zero-shot sentiment analysis, RAG search, the whole thing.

**[🔴 Live Demo on Render](https://novaryn-intelligence-platform.onrender.com)**

## what it does

* **pulls news in real-time** : hits NewsAPI and GNews, stores metadata safely in an embedded SQLite database
* **runs sentiment analysis** : groq API (LLaMA-3) under the hood, classifies the emotional tone of each article on ingest at blazing speeds
* **semantic search** : hugging face inference API embeddings + ChromaDB so you can search by meaning, not just keywords
* **ask it questions** : RAG pipeline with Groq LLM, answers are grounded in actual articles pulled from the vector DB
* **fully containerized** : memory footprint reduced by 90%+ by offloading ML inference to cloud APIs. `docker compose up --build` and you're running
* **CI/CD wired up** : GitHub webhooks → Render, pushes deploy themselves

## stack

* **backend**: FastAPI, SQLAlchemy, Python
* **frontend**: Streamlit, Plotly
* **AI/ML**: Groq API (LLaMA-3), Hugging Face Inference API
* **databases**: SQLite, ChromaDB
* **devops**: Docker, Docker Compose, GitHub Webhooks, Render

## architecture (rough)

```text
GitHub push
  └─▶ Render Webhook (auto-deploy)
         └─▶ Docker Container (512MB limit)
                ├─▶ FastAPI backend ──▶ SQLite
                │                     └─▶ ChromaDB
                │                     └─▶ External APIs (Groq / HF)
                └─▶ Streamlit frontend
