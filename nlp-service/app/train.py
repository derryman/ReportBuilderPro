# Training: load data, spaCy preprocess, TF-IDF + Logistic Regression, save
import json
import sys
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


def load_training_data():
    if not DATA_PATH.exists():
        raise FileNotFoundError(f"Training data not found at {DATA_PATH}")
    with open(DATA_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)
    if not data:
        raise ValueError("training_data.json must be a non-empty array.")
    return data


def main():
    print("Loading training data...")
    raw = load_training_data()
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
