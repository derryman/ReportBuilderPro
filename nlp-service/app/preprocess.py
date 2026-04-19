"""
Stage 1: Text preprocessing using spaCy (en_core_web_sm).

Performs sentence segmentation, lowercasing, and lemmatisation on raw report text.
The resulting sequences are the input features for the TF-IDF vectoriser in
train.py / pipeline.py.

Lemmatisation reduces inflected word forms to their base (e.g. "delayed" → "delay",
"cracks" → "crack"), improving feature generalisation across report writing styles.
Sentence segmentation uses spaCy's dependency-parse-based boundary detector, which
is more robust than rule-based splitters for domain text with abbreviations and lists.
"""
import spacy

try:
    nlp = spacy.load("en_core_web_sm")
except OSError:
    # Graceful degradation: naive period-split + whitespace tokens used when spaCy
    # model is absent (e.g. CI environment without the full model download).
    nlp = None

# AI helped generate this function — it was a bit of a struggle to get the spaCy pipeline working correctly, and the iterative prompts helped me understand how the components fit together. The fallback logic is a bit clunky but necessary to avoid breaking the whole service when the model isn't available.
def sentence_split_and_lemmatize(text: str):
    """
    Split raw text into sentences and lemmatise each token.

    Returns a list of (sentence_str, lemmas) tuples — one per sentence.
    Sentences with no usable tokens (whitespace-only) are excluded.
    """
    if not text or not text.strip():
        return []
    if nlp is None:
        # Fallback: period-split, no lemmatisation — sufficient for smoke tests only.
        sentences = [s.strip() for s in text.replace("\n", " ").split(".") if s.strip()]
        return [(s, s.lower().split()) for s in sentences]

    # spaCy pipeline: tokeniser → tagger → dependency parser → sentence segmenter.
    # Lowercasing before processing normalises capitalisation variance in field reports.
    doc = nlp(text.strip().lower())
    result = []
    for sent in doc.sents:
        sentence_str = sent.text.strip()
        if not sentence_str:
            continue
        # tok.lemma_ gives the base dictionary form; spaces and empty strings excluded.
        lemmas = [tok.lemma_ for tok in sent if not tok.is_space and tok.lemma_.strip()]
        if lemmas:
            result.append((sentence_str, lemmas))
    return result
