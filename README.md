# Novaryn AI

a project that got out of hand — news ingestion, sentiment analysis, RAG search, the whole thing.

---

## what it does

- **pulls news in real-time** — hits NewsAPI and GNews, stores everything in postgres
- **runs sentiment analysis** — distilbert under the hood, classifies each article on ingest
- **semantic search** — MiniLM embeddings + ChromaDB so you can search by meaning, not just keywords
- **ask it questions** — RAG pipeline with Groq LLM, answers are grounded in actual articles
- **fully containerized** — `docker compose up --build` and you're running
- **CI/CD wired up** — GitHub Actions → Jenkins → Docker, pushes deploy themselves

---

## stack

**backend**: FastAPI, SQLAlchemy, Python  
**frontend**: Flask + HTML templates  
**AI/ML**: HuggingFace Transformers, DistilBERT, MiniLM, Groq API  
**databases**: PostgreSQL, ChromaDB  
**devops**: Docker, Docker Compose, Jenkins, GitHub Actions

---

## architecture (rough)
GitHub push
└─▶ GitHub Actions (lint/validate)
└─▶ Jenkins (pipeline trigger)
└─▶ Docker Compose
├─▶ FastAPI backend  ──▶ PostgreSQL
│                   └─▶ ChromaDB
│                         └─▶ NLP / RAG
└─▶ Flask frontend


---

## running it locally

```bash
git clone https://github.com/Ritesh2332/novaryn-intelligence-platform.git
cd novaryn-intelligence-platform

cp .env.example .env   # fill in your keys

docker compose up --build
```

---

## env variables you need

| key | where to get it |
|-----|-----------------|
| `NEWS_API_KEY` | newsapi.org |
| `GNEWS_API_KEY` | gnews.io |
| `GROQ_API_KEY` | console.groq.com |
| `HF_TOKEN` | huggingface (needed for gated models) |
| `DATABASE_URL` | `postgresql://postgres:password@postgres:5432/novaryn_db` |

---

## urls after startup

| | |
|--|--|
| backend | `localhost:8000` |
| swagger docs | `localhost:8000/docs` |
| frontend | `localhost:5000` |

---

## what's next

kubernetes, prometheus + grafana for metrics, redis caching, real-time streaming, cloud deploy automation. open to contributions.

---

## author

Ritesh Kumar Paswan — [github](https://github.com/Ritesh2332) · [linkedin](https://linkedin.com/in/ritesh232)








Claude is AI and can make mistakes. Please double-check responses.
