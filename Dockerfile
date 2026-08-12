FROM python:3.10-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY backend/requirements.txt backend/
COPY frontend/requirements.txt frontend/

# Install python dependencies
RUN pip install --no-cache-dir -r backend/requirements.txt
RUN pip install --no-cache-dir -r frontend/requirements.txt

# Copy source code
COPY . .

# Make start script executable
RUN chmod +x start.sh

# Expose Streamlit port
EXPOSE 7860

CMD ["./start.sh"]
