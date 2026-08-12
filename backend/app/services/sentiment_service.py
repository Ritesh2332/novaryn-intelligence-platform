import os
from groq import Groq

_client = None

def _get_client():
    global _client
    if _client is None:
        _client = Groq(api_key=os.getenv("GROQ_API_KEY"))
    return _client

def analyze_sentiment(text):
    if not text:
        return {"label": "neutral", "score": 0.0}

    try:
        completion = _get_client().chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": "You are a sentiment analyzer. Reply with exactly one word: 'positive', 'negative', or 'neutral'."},
                {"role": "user", "content": text[:1000]}
            ],
            temperature=0.0
        )
        sentiment = completion.choices[0].message.content.strip().lower()
        
        if "positive" in sentiment:
            label = "positive"
        elif "negative" in sentiment:
            label = "negative"
        else:
            label = "neutral"
            
        return {"label": label, "score": 1.0}
    except Exception as e:
        print(f"Sentiment error: {e}")
        return {"label": "neutral", "score": 0.0}