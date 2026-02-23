# Python NLP Service (FastAPI + spaCy + scikit-learn)

- **Preprocessing:** spaCy (tokenization, sentence split, lemmatization)
- **Features:** TF-IDF (word + bigram), scikit-learn
- **Classification:** Logistic Regression with probability
- **Flags:** threshold 0.65, label + snippet + suggested_action

Node backend calls this when `NLP_SERVICE_URL` is set in server/.env.

## Setup

```bash
cd nlp-service
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python -m spacy download en_core_web_sm
python -m app.train
```

## Run

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

Or double-click **run_nlp.bat** (Windows).

## Endpoints

- GET /health
- POST /nlp/analyze  body: `{"text": "..."}`
- POST /nlp/feedback

Set `NLP_SERVICE_URL=http://localhost:8000` in server/.env to use from the app.
