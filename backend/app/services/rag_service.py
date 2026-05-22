from sentence_transformers import SentenceTransformer
from groq import Groq

from backend.app.services.chromadb_service import collection

import os

_model = None


def _get_model():
    global _model
    if _model is None:
        _model = SentenceTransformer("all-MiniLM-L6-v2")
    return _model


client = Groq(
    api_key=os.getenv("GROQ_API_KEY")
)


def generate_rag_answer(query: str):
    query_embedding = _get_model().encode(query).tolist()

    results = collection.query(
        query_embeddings=[query_embedding],
        n_results=3
    )

    documents = results["documents"][0]

    if not documents:

        return {
            "question": query,
            "answer": "No relevant articles found.",
            "sources_used": 0
        }

    context = "\n\n".join(documents)

    prompt = f"""
    You are an AI news analyst.

    Use ONLY the context below.

    Context:
    {context}

    Question:
    {query}
    """

    completion = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {
                "role": "user",
                "content": prompt
            }
        ]
    )

    answer = completion.choices[0].message.content

    return {
        "question": query,
        "answer": answer,
        "sources_used": len(documents)
    }