# NLP: Risk Detection Page & Home Dashboard

## Product goal

People create and upload reports on the site. We scan those reports with the NLP model to find **underlying issues** in the text: **risks** (safety, compliance, hazards), **delays** (schedule, programme), and **material shortages** (supply, stock). The system should be able to **understand or reason with what’s being written** – i.e. pick up meaning and intent, not just keywords – so different phrasings and real report language are handled correctly.

## Structure

- **Risk Detection** (separate page) – Where you **run the model**: select reports, scan selected, trigger NLP.
- **Home** – **Latest scan dashboard**: visuals of issues from the **most recent** document scan (counts by type, issue cards, etc.).

---

## Risk Detection page

- **Route:** `/risk-detection`
- **Purpose:** Run the model on reports.
- **UI:** List of saved reports (from ReportBuilderPro) with checkboxes; “Scan selected” button.
- **Flow:** User selects one or more reports → clicks “Scan selected” → backend runs NLP on each → results stored; user can go to Home to see the latest scan dashboard.

---

## Home = latest scan dashboard

- **Purpose:** Show the **latest document scan** with **visuals** of the issues.
- **Content:**
  - Summary: e.g. “Latest scan” with date and report name.
  - **Visuals:** Counts or charts by issue type (risk / delay / material_shortage).
  - **Issue cards** from the latest scan: label, snippet, confidence, suggested action.
- **Data:** From `GET /api/nlp/latest` (most recent analysis in `ai_analysis`).

---

## Data & backend

- **Reports** – `capturedData` holds text/image per component; we extract all text for NLP.
- **ai_analysis** – One doc per scan: `reportId`, `reportTitle?`, `flags[]`, `processed_at`, `model_version`. “Latest” = most recent by `processed_at`.
- **Endpoints:**
  - `POST /api/reports/:id/analyze` – Analyze one report (extract text → call Python NLP → save to `ai_analysis`).
  - `GET /api/nlp/latest` – Return the most recent analysis (for Home dashboard).

---

## Copy

- **Risk Detection page:** “Select reports to scan for risks, delays, and material issues. Run the model from here.”
- **Home (dashboard):** “Latest scan” + visuals of issues from the most recent document scan.
