# Breakdown of the NLP / AI Component

**ReportBuilderPro – college thesis project**  
This document describes the natural language processing and machine learning used to detect risks, delays, and material shortages in construction site reports.

---

## 1. Aim of the NLP component

The system takes **free-text report content** (from saved reports or uploaded PDFs) and:

- Identifies sentences that describe **risks** (e.g. safety issues, non-compliance),
- **Delays** (e.g. late deliveries, rescheduled work),
- **Material shortages** (e.g. missing or insufficient supplies).

Each flagged sentence is returned with a **confidence score** and a **suggested action**, so users can focus on issues without reading every report line by line. The same pipeline is used for reports created in the app and for PDFs uploaded in the “Demo: Upload PDF” flow.

---

## 2. Pipeline overview

The pipeline has four stages:

```
Input: raw text (full report or PDF-extracted text)
    ↓
1. Preprocessing    →  sentence splitting, tokenization, lemmatization (spaCy)
2. Feature extraction →  TF-IDF (unigrams + bigrams), max 5000 features
3. Classification   →  Logistic Regression → one of: none, delay, risk, material_shortage
4. Post-processing  →  filter by confidence threshold; attach suggested actions; return flags
    ↓
Output: list of flags { label, confidence, snippet, suggested_action }
```

The implementation is in Python (FastAPI service). The main application (Node.js) sends text to this service and displays the returned flags in the UI and on the Home dashboard.

---

## 3. Preprocessing

**Role:** Turn raw text into a consistent, sentence-level representation so the classifier sees stable units and a reduced vocabulary.

**Tool:** [spaCy](https://spacy.io/) with the small English model `en_core_web_sm`.

**Steps:**

1. **Normalisation** – The input is lowercased and stripped of leading/trailing whitespace.
2. **Sentence segmentation** – spaCy splits the text into sentences (e.g. on full stops, newlines, and punctuation). Each sentence is treated as one unit for classification.
3. **Tokenisation** – Each sentence is split into tokens (words and punctuation).
4. **Lemmatisation** – Each token is reduced to its dictionary form (e.g. “delayed” → “delay”, “unsafe” → “unsafe”). This reduces vocabulary size and helps the model generalise across different word forms.

**Output:** For each sentence we keep both the **original snippet** (for display) and the **sequence of lemmas** (for the classifier). If spaCy is not available, a fallback splits on full stops and uses lowercased words.

**Code:** `nlp-service/app/preprocess.py` – `sentence_split_and_lemmatize(text)`.

---

## 4. Feature extraction: TF-IDF

**Role:** Convert each sentence (as a sequence of lemmas) into a numeric vector that the classifier can use.

**Method:** **Term frequency–inverse document frequency (TF-IDF)**.

- **Term frequency (TF):** How often a term appears in the current sentence.
- **Inverse document frequency (IDF):** Downweights terms that appear in many sentences (e.g. “the”, “is”) and emphasises terms that are specific to a few (e.g. “scaffolding”, “shortage”).

**Configuration (in training and inference):**

- **N-grams:** Unigrams (single words) and bigrams (pairs of consecutive words). Bigrams capture phrases like “material shortage” or “not tied”.
- **Max features:** 5000. The vectorizer keeps the 5000 most informative terms by frequency, which keeps the model size and runtime manageable.

**Rationale for TF-IDF:** It is well-understood, interpretable, and works well with limited labelled data. It does not require pre-trained embeddings or large corpora, which fits a thesis project and a domain-specific (construction) vocabulary.

**Code:** Training in `app/train.py` (`TfidfVectorizer`); the fitted vectorizer is saved and loaded in `app/pipeline.py`.

---

## 5. Classification: Logistic Regression

**Role:** For each sentence vector, predict one of four labels: **none**, **delay**, **risk**, **material_shortage**.

**Model:** **Multinomial Logistic Regression** (scikit-learn).

- **Input:** The TF-IDF vector of the sentence (after the same preprocessing and vectorizer as in training).
- **Output:** A probability distribution over the four classes. We take the **argmax** as the predicted label and use the **maximum probability** as the confidence score.

**Rationale:**

- **Probabilistic output** – We get a confidence value for each prediction, which we use for filtering (see below) and for display (e.g. “62%”).
- **Interpretable** – Coefficients indicate which terms push toward which label; useful for thesis discussion and debugging.
- **Efficient** – Fast to train and to run, so the service can respond quickly.
- **Stable with small data** – Works with a few hundred labelled sentences without overfitting as easily as large neural models.

**Code:** Training in `app/train.py`; the fitted classifier is saved and loaded in `app/pipeline.py` (`_classify_sentence_ml`).

---

## 6. Post-processing and output

- **Confidence threshold:** Only sentences whose **maximum class probability is ≥ 0.50** are returned as flags. Others are treated as “none” for display purposes. The threshold can be adjusted (in `app/pipeline.py`) to trade off precision and recall.
- **Suggested actions:** Each label (delay, risk, material_shortage) is mapped to a short recommended action (e.g. “Log in issues register. Schedule follow-up inspection.” for risk). These are fixed in code but could later be made configurable or data-driven.
- **Output format:** Each flag includes:
  - `label` – one of delay, risk, material_shortage
  - `confidence` – float in [0, 1]
  - `snippet` – the original sentence
  - `suggested_action` – the text for that label

The backend (Node.js) stores these in the database and the frontend shows them on the Risk Detection page and on the Home “Latest scan” section.

---

## 7. Training data and training process

**Data source:** `nlp-service/data/training_data.json` – a JSON array of objects `{ "text": "...", "label": "delay" | "risk" | "material_shortage" | "none" }`.

**Content:** Sentences typical of construction or site reports, with labels chosen to reflect real usage (e.g. “Current access to the house is unsafe.” → risk; “Missing some windowsills need more.” → material_shortage). The set includes paraphrases and variants so the model is not tied to a few fixed phrases.

**Training procedure:**

1. Load `training_data.json`.
2. For each item, run the same preprocessing as at inference (sentence split + lemmatisation). Each resulting sentence is one training sample with the item’s label.
3. Fit the TF-IDF vectorizer on the training sentences (lemma strings).
4. Fit the Logistic Regression classifier on the vectorized data.
5. Persist the vectorizer and classifier to `nlp-service/model/` (e.g. `vectorizer.joblib`, `classifier.joblib`).

**Retraining:** When new examples are added to `training_data.json`, running `python -m app.train` rebuilds the model. The live service must be restarted to load the new files. There is no online learning; the model is static between retrains.

**Code:** `nlp-service/app/train.py`. Training metrics (e.g. accuracy, per-class precision/recall) are printed at the end of training and can be used in the thesis to describe performance.

---

## 8. Integration with the rest of the system

- **PDF upload:** The Node backend receives the PDF, extracts text (e.g. with `pdf-parse`), sends the extracted text to the NLP service, and returns the flags (and optional text preview) to the frontend.
- **Saved reports:** When the user runs “Scan” on a saved report, the backend builds a single text from the report’s captured fields, sends it to the same NLP endpoint, and stores the result in the `ai_analysis` collection.
- **Home dashboard:** The “Latest scan” section reads the most recent entry in `ai_analysis` for the current user and displays the flags and counts.

So the NLP component is a **separate service** (Python/FastAPI) that the main app (Node) calls over HTTP. The same pipeline and model are used for both PDF uploads and report scans.

---

## 9. Optional: LLM-based classification

The codebase supports an **optional** path that uses an **LLM** (e.g. Azure OpenAI) instead of the TF-IDF + Logistic Regression model for classifying each sentence. It is switched on via environment variables (`NLP_CLASSIFIER_MODE=llm`, plus Azure OpenAI endpoint and key). The prompt asks the model to classify the sentence into one of: risk, delay, material_shortage, none.

**Thesis relevance:** You can describe this as “future work” or “alternative design”: the LLM can handle more varied wording and implicit meaning but at higher cost and latency and with less control than the current ML pipeline. The thesis can compare both approaches (traditional ML vs. LLM) in terms of accuracy, interpretability, and resource use.

---

## 10. Limitations and possible extensions

**Limitations:**

- **Domain dependence** – Performance depends on training sentences being similar in style and vocabulary to real reports. Very different wording may score below the confidence threshold.
- **Sentence-level only** – Context across sentences (e.g. “No issues” followed by “Delivery delayed”) is not modelled; each sentence is classified independently.
- **Fixed labels** – The four classes (none, delay, risk, material_shortage) are fixed. Adding a new category requires new training data and retraining.
- **No calibration** – Confidence values are model probabilities, not necessarily well-calibrated for decision-making (e.g. 0.6 may not mean “60% chance of being correct” in practice).

**Possible extensions for the thesis or future work:**

- **Evaluation** – Hold out a test set from `training_data.json` (or collect a separate test set), report precision/recall/F1 per class and overall accuracy, and discuss confusion between classes (e.g. delay vs. risk).
- **Threshold analysis** – Vary the confidence threshold and show how precision/recall change.
- **Error analysis** – Manually inspect false positives and false negatives and link them to wording or label balance.
- **LLM comparison** – If the LLM path is enabled, compare it to the TF-IDF + LR model on the same inputs and discuss trade-offs.
- **More data** – Incorporate real report sentences (with consent) into `training_data.json` and retrain; measure improvement.

---

## 11. Summary table (for slides or thesis)

| Component        | Choice                    | Purpose |
|-----------------|---------------------------|--------|
| Preprocessing   | spaCy (en_core_web_sm)    | Sentence splitting, tokenisation, lemmatisation |
| Features        | TF-IDF, unigrams + bigrams, max 5000 | Numeric representation of each sentence |
| Classifier      | Logistic Regression       | Multi-class label + confidence per sentence |
| Labels          | none, delay, risk, material_shortage | Aligned with construction report issues |
| Training        | Supervised, from JSON      | Domain-specific, expandable with new examples |
| Threshold       | 0.50                      | Only show flags above this confidence |
| Integration     | HTTP API (FastAPI)         | Called by Node backend for PDF and report scans |

This breakdown should be enough to describe the NLP/AI work in the thesis and to answer questions about design, implementation, and limitations during the demo or viva.
