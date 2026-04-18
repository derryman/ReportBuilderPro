"""
Train the sklearn classifier: JSON sentences → spaCy lemmas → TF-IDF → Logistic Regression.

Writes `model/vectorizer.joblib` and `model/classifier.joblib` next to this package.
Run from repo: `python -m app.train` (cwd: nlp-service).
"""
import argparse
import json
import sys
from collections import Counter
from pathlib import Path

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, classification_report
from joblib import dump

from app.preprocess import sentence_split_and_lemmatize
from app.pipeline import MODEL_DIR

LABELS = ["none", "delay", "risk", "material_shortage"]
ROOT = Path(__file__).resolve().parent.parent
DATA_PATH = ROOT / "data" / "training_data.json"


def parse_args():
    parser = argparse.ArgumentParser(description="Train the ReportBuilderPro NLP model.")
    parser.add_argument(
        "--data",
        type=Path,
        default=DATA_PATH,
        help="Path to the JSON training data file",
    )
    return parser.parse_args()


def load_training_data(data_path: Path):
    if not data_path.exists():
        raise FileNotFoundError(f"Training data not found at {data_path}")
    with open(data_path, "r", encoding="utf-8") as f:
        data = json.load(f)
    if not data:
        raise ValueError(f"{data_path.name} must be a non-empty array.")
    return data


def main():
    args = parse_args()
    print(f"Loading training data from {args.data}...")
    raw = load_training_data(args.data)
    print("Preprocessing (spaCy)...")
    X_texts = []
    y = []
    for item in raw:
        label = (item.get("label") or "none").strip().lower()
        if label not in LABELS:
            continue
        for sent_str, tokens in sentence_split_and_lemmatize(item["text"]):
            if not tokens:
                continue
            X_texts.append(" ".join(tokens))
            y.append(label)
    print(f"Training set: {len(X_texts)} samples.")
    print(f"Label distribution: {dict(Counter(y))}")
    print("Fitting TF-IDF (word + bigram)...")
    vectorizer = TfidfVectorizer(ngram_range=(1, 2), max_features=5000)
    X = vectorizer.fit_transform(X_texts)
    print("Training Logistic Regression...")
    clf = LogisticRegression(max_iter=1000, random_state=42)
    clf.fit(X, y)
    pred = clf.predict(X)
    print(f"Training accuracy: {accuracy_score(y, pred):.2%}")
    print(classification_report(y, pred))
    MODEL_DIR.mkdir(parents=True, exist_ok=True)
    dump(vectorizer, MODEL_DIR / "vectorizer.joblib")
    dump(clf, MODEL_DIR / "classifier.joblib")
    print(f"Model saved to {MODEL_DIR}")


if __name__ == "__main__":
    main()
    sys.exit(0)
