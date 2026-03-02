# NLP demo script (Risk Detection + PDF upload)

Use this for a short demo: upload a single-page PDF, show the findings, and describe what’s going on at each step.

**For a full breakdown of the NLP/AI (thesis-style):** see **NLP_AI_BREAKDOWN.md** in this folder. It covers preprocessing, TF-IDF, Logistic Regression, training data, integration, limitations, and optional LLM—suitable for the thesis and for answering “how does the AI work?” in detail.

---

## Before the demo

1. **Run the stack locally**
   - `run_all_local.bat` (or start Node API, NLP service, and web app).
   - Ensure `server/.env` or `server/.env.local` has `NLP_SERVICE_URL=http://localhost:8000`.
   - Open the web app (e.g. `http://localhost:5173`), log in (e.g. admin / admin).

2. **Prepare your demo PDF**
   - Use **TESTINGSitereport1.pdf** (or any one-page site report with clear risk/delay/material-shortage sentences).
   - Good examples: “Current access to the house is unsafe.”, “Scaffolding is not tied properly.”, “Missing some windowsills need more.”

---

## What’s going on (how to describe it)

Use these when you want to explain what’s happening, in plain language.

### In one sentence

*“The app takes the PDF, pulls out the text, sends it to a small AI that’s been trained to spot risks, delays, and material shortages in construction-style reports, then shows you the flagged sentences and suggested actions.”*

### Step by step (what to say while you demo)

1. **When you open Risk Detection**
   - *“This is where we run risk detection. We can scan saved reports or, for the demo, upload a PDF directly.”*

2. **When you choose the PDF**
   - *“I’m uploading a single-page site report. As soon as I select it, the app sends it to our backend.”*

3. **While it’s loading (extracting + analysing)**
   - *“Behind the scenes, the server is doing two things: first it extracts the text from the PDF, then it sends that text to our NLP service—a small machine-learning model that’s been trained on construction report phrases. It looks at each sentence and decides if it’s a risk, a delay, a material shortage, or none of those.”*

4. **When the results appear**
   - *“Here are the findings. Each row is a sentence the model flagged: we see the type—risk or material shortage—how confident the model is, the exact sentence, and a suggested action. So we’re not just highlighting problems; we’re suggesting what to do next.”*

5. **When you go to Home**
   - *“Every time we run a scan—whether from a PDF or from a saved report—we store the result. So on Home, the ‘Latest scan’ section always shows the most recent run. That way the dashboard stays up to date without extra steps.”*

### If they ask “How does it know what’s a risk?”

*“We trained it on a set of example sentences we labelled—things like ‘Delivery delayed’, ‘Safety risk on site’, ‘Material shortage reported’. The model learned patterns from those and applies them to new text. We can add more examples to the training data whenever we want it to recognise new phrases or sites.”*

### If they ask “Can it read any PDF?”

*“It works best on PDFs that contain real text—like something exported from Word or filled in on screen. If the PDF is just a scan of a piece of paper with no selectable text, we’d need a separate step like OCR to get text first.”*

---

## Demo flow (about 5 minutes)

### 1. Show Risk Detection and PDF upload

- Go to **Risk Detection** in the app.
- Point out the **“Demo: Upload PDF”** section.
- **Choose file** → select **TESTINGSitereport1.pdf** (or your demo PDF).
- While it runs, use the “Step by step” lines above if you want to describe what’s happening.
- When results appear, walk through each flag: type, confidence, snippet, suggested action.

### 2. Show the same result on Home

- Click **“View on Home”** (or go to **Home**).
- Show **Latest scan**: same run, same flags, optional counts by type.
- Say something like: *“Every scan is saved so the dashboard always reflects the latest run.”*

### 3. (Optional) Technical flow

If someone wants the technical version:

| Step | Where | What happens |
|------|--------|--------------|
| 1 | **Frontend** | User selects PDF → sends it as `POST /api/nlp/analyze-pdf` (with auth). |
| 2 | **Node API** | Receives the file, uses `pdf-parse` to extract text from the PDF. |
| 3 | **Node API** | Sends the extracted text to the Python NLP service (`POST /nlp/analyze`). |
| 4 | **NLP service** (Python) | Splits text into sentences (spaCy), runs a small ML model (TF-IDF + classifier) on each sentence, returns **flags**: label, confidence, snippet, suggested action. |
| 5 | **Node API** | Saves the result to the database (`ai_analysis`) so Home can show “Latest scan”. Sends the flags back to the frontend. |
| 6 | **Frontend** | Shows the flags under the upload area and links to Home. |

**One-liner for tech audience:** *“We extract text from the PDF on the server, send it to our Python NLP service, which classifies each sentence as risk, delay, material shortage, or none, then we display the findings and store them for the dashboard.”*

---

## If something goes wrong

- **“NLP service not configured”**  
  - Add `NLP_SERVICE_URL=http://localhost:8000` in `server/.env` or `server/.env.local`, then restart the Node server.  
  - Make sure the NLP service is running (e.g. `uvicorn` on port 8000).

- **“NLP service unavailable”**  
  - Start the NLP service from `nlp-service` (e.g. `run_nlp.bat` or `uvicorn app.main:app --host 0.0.0.0 --port 8000`).  
  - Check `http://localhost:8000/health` returns `model_loaded: true`.

- **“Could not extract text from PDF”**  
  - Use a PDF with selectable text (e.g. exported from Word), not a scan-only image.

- **No flags but the PDF has clear risk/delay/shortage text**  
  - Ensure you’ve run `python -m app.train` in `nlp-service` and restarted the NLP service so it uses the latest model.
