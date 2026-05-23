_classifier = None


def _get_classifier():
    global _classifier
    if _classifier is None:
        from transformers import pipeline
        _classifier = pipeline(
            "sentiment-analysis",
            model="distilbert-base-uncased-finetuned-sst-2-english"
        )
    return _classifier


def analyze_sentiment(text):
    if not text:
        return {
            "label": "neutral",
            "score": 0.0
        }

    result = _get_classifier()(text[:512])[0]

    return {
        "label": result["label"].lower(),
        "score": float(result["score"])
    }