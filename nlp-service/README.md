# Python NLP Service (FastAPI + spaCy + scikit-learn)

- **Preprocessing:** spaCy (tokenization, sentence split, lemmatization)
- **Features:** TF-IDF (word + bigram), scikit-learn
- **Classification:** Logistic Regression with probability
- **Flags:** threshold 0.65, label + snippet + suggested_action

Node backend calls this when `NLP_SERVICE_URL` is set in server/.env.

## Training data (how to add more “risks” and improve the model)

The model is **not** stored in MongoDB. It is trained from **`data/training_data.json`**. Each line is an object:

- **`text`** – One sentence (e.g. from a report).
- **`label`** – One of: `"risk"`, `"delay"`, `"material_shortage"`, `"none"`.

To make the AI better at detecting risks, delays, and material shortages:

1. **Add more examples** to `data/training_data.json`. Use real report-style sentences and the correct label. Keep a balance between the four labels so the model doesn’t favour one.
2. **Optional:** convert the richer construction megapack into an augmented training file:
   ```bash
   cd nlp-service
   venv\Scripts\activate
   python -m app.convert_megapack
   ```
   This writes:
   - `data/training_data_megapack_converted.json`
   - `data/training_data_augmented.json`
   - `data/training_data_megapack_report_style.json`
   - `data/training_data_augmented_report_style.json`
   - `data/training_data_augmented_summary.json`
   The `*_report_style.json` files rewrite synthetic examples into shorter site-note wording so the model learns language closer to real inspection reports.
3. **Retrain** the model:
   ```bash
   cd nlp-service
   venv\Scripts\activate
   python -m app.train
   ```
   Or train from the augmented dataset:
   ```bash
   python -m app.train --data data/training_data_augmented.json
   ```
   For the most report-like training run, use:
   ```bash
   python -m app.train --data data/training_data_augmented_report_style.json
   ```
4. **Restart** the NLP service (e.g. run `run_nlp.bat` or uvicorn again).

## Production build

The Docker image trains the model at build time using:

```bash
python -m app.train --data data/training_data_augmented_report_style.json
```

That means Azure Container Apps will pick up the latest report-style dataset when this repo is pushed and rebuilt.

The script writes `model/vectorizer.joblib` and `model/classifier.joblib`. The running service loads these; no database is used for the model itself.

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

## Unit tests

These checks are for **local development and dissertation evidence** (regression on preprocessing and pipeline behaviour). They are **not** part of Azure runtime: the container runs the API; CI or your machine runs `unittest` when you choose to.

You still need the **venv and dependencies** from [Setup](#setup) (`pip install -r requirements.txt`, spaCy model, etc.). Azure hosting does not replace a local Python env for running tests.

**If tests “fail” with `ModuleNotFoundError: No module named 'joblib'` or `'spacy'`** before any individual test runs, that is an **environment** problem, not a failed assertion. You are using a Python interpreter that does not have `nlp-service/requirements.txt` installed (often `C:\Python312\python.exe` instead of `venv\Scripts\python.exe`). Fix: activate the project venv, then `pip install -r requirements.txt`, then run the tests again. On Windows you can double-click **`run_tests.bat`** in this folder (after `setup_nlp.bat` has created `venv`).

**Recommended** — from the `nlp-service` folder (with venv activated):

```bash
cd nlp-service
venv\Scripts\activate
python -m unittest discover -s tests
```

Windows shortcut: double-click **`run_tests.bat`** (uses `venv` in this folder automatically).

**Also valid** — from `nlp-service/tests` (test modules add the service root to `sys.path`):

```bash
cd nlp-service/tests
python -m unittest discover -s . -p "test_*.py"
```

Avoid `python -m unittest discover -s tests` while your cwd is already `tests/` (that looks for `tests/tests` and fails with “Start directory is not importable”).

## Endpoints

- GET /health
- POST /nlp/analyze  body: `{"text": "..."}`
- POST /nlp/feedback

Set `NLP_SERVICE_URL=http://localhost:8000` in server/.env to use from the app.
