"""
Novaryn AI Platform - Flask Frontend
"""
from flask import Flask, render_template, request, jsonify
import requests
import os

app = Flask(__name__)

# Backend API URL
BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:8000")

@app.route('/')
def index():
    """Dashboard page"""
    return render_template('dashboard.html')

@app.route('/rag')
def rag():
    """RAG Q&A page"""
    return render_template('rag.html')

@app.route('/analytics')
def analytics():
    """Analytics page"""
    return render_template('analytics.html')

@app.route('/api/analytics/dashboard')
def api_analytics_dashboard():
    """Proxy for analytics dashboard API"""
    try:
        response = requests.get(f"{BACKEND_URL}/api/analytics/dashboard")
        return response.json()
    except Exception as e:
        return jsonify({
            "total_articles": 0,
            "sentiment_distribution": {"positive": 0, "negative": 0, "neutral": 0},
            "category_distribution": {},
            "top_sources": [],
            "sentiment_trends": {"labels": [], "positive": [], "negative": [], "neutral": []},
            "avg_response_time": 0,
            "queries_today": 0
        })

@app.route('/api/rag/ask', methods=['POST'])
def api_rag_ask():
    """Proxy for RAG ask API"""
    try:
        data = request.get_json()
        response = requests.post(f"{BACKEND_URL}/api/rag/ask", json=data)
        return response.json()
    except Exception as e:
        return jsonify({
            "question": data.get("question", ""),
            "answer": "Sorry, I'm having trouble connecting to the AI service. Please try again later.",
            "sources": [],
            "k": data.get("k", 5),
            "timestamp": str(datetime.now())
        })

if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)
