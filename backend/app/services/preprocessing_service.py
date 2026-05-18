import re
import nltk
import spacy

from nltk.corpus import stopwords
from nltk.stem import WordNetLemmatizer

nlp = spacy.load("en_core_web_sm")

stop_words = set(stopwords.words("english"))
lemmatizer = WordNetLemmatizer()


def preprocess_text(text):

    if not text:
        return ""

    text = text.lower()

    text = re.sub(r"http\S+", "", text)

    text = re.sub(r"[^a-zA-Z\s]", "", text)

    tokens = nltk.word_tokenize(text)

    cleaned_tokens = []

    for token in tokens:

        if token not in stop_words:

            lemma = lemmatizer.lemmatize(token)

            cleaned_tokens.append(lemma)

    return " ".join(cleaned_tokens)