FROM python:3.11-slim

WORKDIR /app

# Install backend dependencies
COPY backend/requirements.txt ./backend/
RUN pip install --no-cache-dir -r backend/requirements.txt

# Download spaCy and NLTK data
RUN python -m spacy download en_core_web_sm
RUN python -m nltk.downloader stopwords wordnet punkt

# Pre-download HuggingFace models at build time
ENV HF_HOME=/app/.cache/huggingface
RUN mkdir -p /app/.cache/huggingface
RUN python -c "from transformers import pipeline; pipeline('sentiment-analysis', model='distilbert-base-uncased-finetuned-sst-2-english')"
RUN python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('all-MiniLM-L6-v2')"

# Copy all code
COPY . .

# Use SQLite for HF Spaces (no PostgreSQL)
ENV DATABASE_URL="sqlite:///./app.db"

# HF Spaces uses port 7860 by default
EXPOSE 7860

CMD ["sh", "-c", "uvicorn backend.app.main:app --host 0.0.0.0 --port ${PORT:-7860}"]
