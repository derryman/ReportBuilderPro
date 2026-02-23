"""
NLP pipeline: load model, preprocess, TF-IDF, classify, generate flags.
"""
import time
from pathlib import Path

from joblib import load

from app.preprocess import sentence_split_and_lemmatize

MODEL_DIR = Path(__file__).resolve().parent.parent / "model"
LABELS_WITH_ACTIONS = ["delay", "risk", "material_shortage"]
CONFIDENCE_THRESHOLD = 0.65

SUGGESTED_ACTIONS = {
    "delay": "Update schedule and notify client. Review dependencies.",
    "risk": "Log in issues register. Schedule follow-up inspection.",
    "material_shortage": "Check stock levels. Contact supplier for delivery timeline.",
}

_vectorizer = None
_classifier = None


def load_model():
    global _vectorizer, _classifier
    if _vectorizer is not None and _classifier is not None:
        return True
    vec_path = MODEL_DIR / "vectorizer.joblib"
    clf_path = MODEL_DIR / "classifier.joblib"
    if not vec_path.exists() or not clf_path.exists():
        return False
    _vectorizer = load(vec_path)
    _classifier = load(clf_path)
    return True


def is_model_available():
    return load_model()


def analyze_text(text: str):
    start = time.perf_counter()
    if not text or not text.strip():
        return {
            "flags": [],
            "metadata": {"text_length": 0, "sentence_count": 0, "processing_time_ms": 0, "model_version": "python-ml-v1.0"},
        }
    if not load_model():
        raise RuntimeError("Model not found. Run: python -m app.train")
    sentences_with_tokens = sentence_split_and_lemmatize(text)
    flags = []
    for idx, (sentence_str, tokens) in enumerate(sentences_with_tokens):
        if not tokens:
            continue
        features_str = " ".join(tokens)
        X = _vectorizer.transform([features_str])
        probs = _classifier.predict_proba(X)[0]
        class_idx = probs.argmax()
        prob = float(probs[class_idx])
        label = _classifier.classes_[class_idx] if hasattr(_classifier, "classes_") else "none"
        if label in LABELS_WITH_ACTIONS and prob >= CONFIDENCE_THRESHOLD:
            flags.append({
                "label": label,
                "confidence": round(prob, 2),
                "snippet": sentence_str,
                "suggested_action": SUGGESTED_ACTIONS.get(label, "Review and take action."),
                "sentence_index": idx,
            })
    elapsed_ms = (time.perf_counter() - start) * 1000
    return {
        "flags": flags,
        "metadata": {
            "text_length": len(text),
            "sentence_count": len(sentences_with_tokens),
            "processing_time_ms": round(elapsed_ms, 2),
            "model_version": "python-ml-v1.0",
        },
    }
