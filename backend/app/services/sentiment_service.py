from transformers import pipeline

classifier = pipeline(
    "sentiment-analysis",
    model="distilbert-base-uncased-finetuned-sst-2-english"
)


def analyze_sentiment(text):

    if not text:
        return {
            "label": "neutral",
            "score": 0.0
        }

    result = classifier(text[:512])[0]

    return {
        "label": result["label"].lower(),
        "score": float(result["score"])
    }