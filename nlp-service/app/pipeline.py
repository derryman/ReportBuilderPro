"""
Inference pipeline: load model artefacts, classify sentences, produce structured flags.

The primary path is a lightweight ML classifier:
  1. preprocess.py segments and lemmatises each sentence (spaCy en_core_web_sm).
  2. Lemmas are joined into a feature string and transformed by the TF-IDF vectoriser.
  3. LogisticRegression.predict_proba() returns per-class probability estimates.
  4. Sentences where the highest-probability class is in LABELS_WITH_ACTIONS and
     confidence ≥ CONFIDENCE_THRESHOLD are surfaced as flags to the frontend.

An optional LLM path (Azure OpenAI) is also implemented and selectable at runtime via
the NLP_CLASSIFIER_MODE environment variable ("ml" | "llm" | "hybrid"). The LLM path
was prototyped as a design alternative during development; "ml" is the production mode.
Because the API contract is identical for both paths, switching modes requires no
changes to the Node.js backend or the React frontend.

References:
  Salton, G., & Buckley, C. (1988). Term-weighting approaches in automatic text
    retrieval. Information Processing & Management, 24(5), 513–523.
  Pedregosa, F. et al. (2011). Scikit-learn: Machine learning in Python.
    Journal of Machine Learning Research, 12, 2825–2830.
  Brown, T. et al. (2020). Language models are few-shot learners. NeurIPS 33.
    (context for LLM-based classification approach)
"""
import os
import time
from pathlib import Path
from typing import Dict, List, Tuple

import requests
from joblib import load

from app.preprocess import sentence_split_and_lemmatize

MODEL_DIR = Path(__file__).resolve().parent.parent / "model"
# Labels that produce a flag. "none" is the null class and is filtered out.
LABELS_WITH_ACTIONS = ["delay", "risk", "material_shortage"]

# Minimum posterior probability required to surface a flag.
# Set at 0.50 (majority class threshold): sentences where the classifier is not
# meaningfully more confident in an action class than in "none" are suppressed.
# This was tuned empirically on the construction training corpus to balance
# precision (avoiding false alarms) against recall (catching genuine issues).
CONFIDENCE_THRESHOLD = 0.50

# Suggested remediation text surfaced alongside each flag in the UI.
# These are static lookups — a future extension could generate contextual advice
# using the LLM path in _classify_sentence_llm().
SUGGESTED_ACTIONS = {
    "delay": "Update schedule and notify client. Review dependencies.",
    "risk": "Log in issues register. Schedule follow-up inspection.",
    "material_shortage": "Check stock levels. Contact supplier for delivery timeline.",
}

LLM_ALLOWED_LABELS = ["none", "delay", "risk", "material_shortage"]

# Classifier mode:
#   "ml"    -> use TF-IDF + Logistic Regression only (default)
#   "llm"   -> use LLM-only classifier
#   "hybrid"-> currently treated as "llm" (hook for future mixing)
CLASSIFIER_MODE = os.environ.get("NLP_CLASSIFIER_MODE", "ml").strip().lower()
if CLASSIFIER_MODE not in {"ml", "llm", "hybrid"}:
    CLASSIFIER_MODE = "ml"

# Azure OpenAI (LLM) configuration – optional
AZURE_OAI_ENDPOINT = os.environ.get("AZURE_OPENAI_ENDPOINT", "").rstrip("/")
AZURE_OAI_KEY = os.environ.get("AZURE_OPENAI_KEY", "")
AZURE_OAI_DEPLOYMENT = os.environ.get("AZURE_OPENAI_DEPLOYMENT_NAME", "")
AZURE_OAI_API_VERSION = os.environ.get("AZURE_OPENAI_API_VERSION", "2024-10-01-preview")

_vectorizer = None
_classifier = None


def _has_llm_config() -> bool:
    return bool(AZURE_OAI_ENDPOINT and AZURE_OAI_KEY and AZURE_OAI_DEPLOYMENT)


def load_model() -> bool:
    """Load TF-IDF + Logistic Regression model into memory if present."""
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


def is_model_available() -> bool:
    """
    Health check hook for FastAPI:
    - If running in ML mode, check TF-IDF model is available.
    - If running in LLM mode, check we have LLM config.
    """
    if CLASSIFIER_MODE in {"llm", "hybrid"}:
        return _has_llm_config()
    return load_model()


def _classify_sentence_ml(tokens: List[str]) -> Tuple[str, float]:
    """
    Classify a pre-lemmatised sentence via TF-IDF + Logistic Regression.

    Returns (label, confidence) where confidence is the softmax posterior
    probability for the predicted class.  Logistic Regression provides
    well-calibrated probabilities suitable for thresholding (unlike SVM or
    naive distance-based classifiers).
    """
    if not load_model():
        raise RuntimeError("Model not found. Run: python -m app.train")
    # Rejoin lemmas into a space-separated string — the format the vectoriser was
    # trained on (see train.py: X_texts.append(" ".join(tokens))).
    features_str = " ".join(tokens)
    X = _vectorizer.transform([features_str])
    # predict_proba returns a row vector over all classes in classifier.classes_ order.
    probs = _classifier.predict_proba(X)[0]
    class_idx = probs.argmax()
    prob = float(probs[class_idx])
    label = _classifier.classes_[class_idx] if hasattr(_classifier, "classes_") else "none"
    return label, prob


def _classify_sentence_llm(sentence: str) -> str:
    """
    Alternative classifier path: zero-shot sentence classification via Azure OpenAI.

    The LLM is prompted to return exactly one of the four label tokens.
    temperature=0.0 is set to make responses deterministic (greedy decoding).
    max_tokens=1 limits the response to a single token, reducing cost and latency.

    This approach follows zero-shot classification as described in:
      Brown, T. et al. (2020). Language models are few-shot learners. NeurIPS 33.

    Note: unlike Logistic Regression, LLMs do not produce calibrated posterior
    probabilities.  A fixed confidence of 0.95 is assigned for flagged labels
    as a placeholder to satisfy the downstream threshold check.
    """
    if not _has_llm_config():
        raise RuntimeError("LLM configuration missing. Set AZURE_OPENAI_* env vars.")

    url = f"{AZURE_OAI_ENDPOINT}/openai/deployments/{AZURE_OAI_DEPLOYMENT}/chat/completions"
    params = {"api-version": AZURE_OAI_API_VERSION}
    headers = {
        "Content-Type": "application/json",
        "api-key": AZURE_OAI_KEY,
    }
    prompt = (
        "You are a classification assistant for construction site reports.\n"
        "Classify the following sentence into exactly one of these labels:\n"
        "risk, delay, material_shortage, none.\n\n"
        "Return only the label word with no explanation.\n"
    )
    payload: Dict = {
        "messages": [
            {"role": "system", "content": prompt},
            {
                "role": "user",
                "content": sentence.strip(),
            },
        ],
        "temperature": 0.0,
        "max_tokens": 1,
    }
    resp = requests.post(url, headers=headers, params=params, json=payload, timeout=15)
    resp.raise_for_status()
    data = resp.json()
    content = (
        data.get("choices", [{}])[0]
        .get("message", {})
        .get("content", "")
        .strip()
        .lower()
    )
    if content not in LLM_ALLOWED_LABELS:
        # Normalise obvious variants, otherwise treat as "none"
        if "delay" in content:
            return "delay"
        if "risk" in content:
            return "risk"
        if "shortage" in content or "material" in content:
            return "material_shortage"
        return "none"
    return content


def analyze_text(text: str) -> Dict:
    start = time.perf_counter()
    if not text or not text.strip():
        return {
            "flags": [],
            "metadata": {
                "text_length": 0,
                "sentence_count": 0,
                "processing_time_ms": 0,
                "model_version": "python-ml-v1.0",
                "classifier_mode": CLASSIFIER_MODE,
            },
        }

    sentences_with_tokens = sentence_split_and_lemmatize(text)
    flags = []

    # Choose classifier path
    use_llm = CLASSIFIER_MODE in {"llm", "hybrid"} and _has_llm_config()

    for idx, (sentence_str, tokens) in enumerate(sentences_with_tokens):
        if not tokens:
            continue

        if use_llm:
            try:
                label = _classify_sentence_llm(sentence_str)
                # LLM does not provide calibrated probabilities; treat as high confidence
                prob = 0.95 if label != "none" else 0.0
            except Exception:
                # Fallback to ML if LLM call fails
                label, prob = _classify_sentence_ml(tokens)
        else:
            label, prob = _classify_sentence_ml(tokens)

        if label in LABELS_WITH_ACTIONS and prob >= CONFIDENCE_THRESHOLD:
            flags.append(
                {
                    "label": label,
                    "confidence": round(prob, 2),
                    "snippet": sentence_str,
                    "suggested_action": SUGGESTED_ACTIONS.get(
                        label, "Review and take action."
                    ),
                    "sentence_index": idx,
                }
            )

    elapsed_ms = (time.perf_counter() - start) * 1000
    return {
        "flags": flags,
        "metadata": {
            "text_length": len(text),
            "sentence_count": len(sentences_with_tokens),
            "processing_time_ms": round(elapsed_ms, 2),
            "model_version": "python-ml-v1.0",
            "classifier_mode": CLASSIFIER_MODE,
        },
    }
