"""
Stage 1: Preprocessing with spaCy (`en_core_web_sm`).

Lowercasing, sentence boundaries, and per-sentence lemmas for the TF-IDF vectorizer.
If spaCy is not installed, falls back to naive `.` splitting and whitespace tokens
(works for smoke tests; install the model for real accuracy).
"""
import spacy

try:
    nlp = spacy.load("en_core_web_sm")
except OSError:
    nlp = None


def sentence_split_and_lemmatize(text: str):
    """Split text into sentences and return (sentence_str, lemmas) per sentence."""
    if not text or not text.strip():
        return []
    if nlp is None:
        sentences = [s.strip() for s in text.replace("\n", " ").split(".") if s.strip()]
        return [(s, s.lower().split()) for s in sentences]
    doc = nlp(text.strip().lower())
    result = []
    for sent in doc.sents:
        sentence_str = sent.text.strip()
        if not sentence_str:
            continue
        lemmas = [tok.lemma_ for tok in sent if not tok.is_space and tok.lemma_.strip()]
        if lemmas:
            result.append((sentence_str, lemmas))
    return result
