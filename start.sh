#!/bin/bash

# Start FastAPI backend in the background
uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 &

# Wait a moment to ensure backend is starting
sleep 3

# Start Streamlit frontend
streamlit run frontend/app.py --server.port 7860 --server.address 0.0.0.0
