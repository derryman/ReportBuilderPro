# Held-out evaluation — trains on 80% of the dataset and tests on the unseen 20%
# Run from the nlp-service directory: python -m tests.splittest
import json
from collections import Counter
from pathlib import Path

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, classification_report
from sklearn.model_selection import train_test_split

from app.preprocess import sentence_split_and_lemmatize

LABELS = ["none", "delay", "risk", "material_shortage"]
ROOT = Path(__file__).resolve().parent.parent
DATA_PATH = ROOT / "data" / "training_data.json"

with open(DATA_PATH, "r", encoding="utf-8") as f:
    raw = json.load(f)

X_texts, y = [], []
for item in raw:
    label = (item.get("label") or "none").strip().lower()
    if label not in LABELS:
        continue
    for _, tokens in sentence_split_and_lemmatize(item["text"]):
        if not tokens:
            continue
        X_texts.append(" ".join(tokens))
        y.append(label)

print(f"Total samples: {len(X_texts)}")
print(f"Label distribution: {dict(Counter(y))}")

X_train, X_test, y_train, y_test = train_test_split(
    X_texts, y, test_size=0.2, random_state=42, stratify=y
)

vectorizer = TfidfVectorizer(ngram_range=(1, 2), max_features=5000)
X_train_vec = vectorizer.fit_transform(X_train)
X_test_vec = vectorizer.transform(X_test)

clf = LogisticRegression(max_iter=1000, random_state=42)
clf.fit(X_train_vec, y_train)

y_pred = clf.predict(X_test_vec)

print(f"\nTest accuracy: {accuracy_score(y_test, y_pred):.2%}")
print("\nPer-class report:")
print(classification_report(y_test, y_pred))
