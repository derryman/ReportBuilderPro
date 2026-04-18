"""
HTTP API for construction-report NLP.

Endpoints:
  GET  /health          — process up; model/LLM config readiness for ops
  POST /nlp/analyze     — classify sentences → flags (delay, risk, material_shortage, …)
  POST /nlp/feedback    — placeholder for future human-in-the-loop training

Implementation lives in `app.pipeline` (ML and optional Azure OpenAI). CORS is open for
dev; tighten `allow_origins` in production behind your gateway.
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from app.pipeline import analyze_text, is_model_available

app = FastAPI(title="ReportBuilderPro NLP Service")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])


class AnalyzeRequest(BaseModel):
    report_id: str | None = None
    text: str


class FeedbackRequest(BaseModel):
    analysis_id: str
    flag_index: int
    user_action: str
    corrected_label: str | None = None
    notes: str | None = None


@app.get("/health")
def health():
    """Liveness + whether the configured classifier backend is ready."""
    return {"status": "ok", "model_loaded": is_model_available()}


@app.post("/nlp/analyze")
def nlp_analyze(req: AnalyzeRequest):
    """Return structured flags + metadata for the supplied report text body."""
    if not req.text or not req.text.strip():
        raise HTTPException(status_code=400, detail="Text is required")
    try:
        result = analyze_text(req.text)
        return {"analysis_id": None, "flags": result["flags"], "metadata": result["metadata"]}
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))


@app.post("/nlp/feedback")
def nlp_feedback(req: FeedbackRequest):
    """Stub: accept user corrections for future retraining or analytics."""
    return {"success": True, "message": "Feedback received."}


if __name__ == "__main__":
    import os
    import uvicorn
    port = int(os.environ.get("PORT", "8000"))
    uvicorn.run(app, host="0.0.0.0", port=port)
