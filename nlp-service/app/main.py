"""
FastAPI HTTP layer for the ReportBuilderPro NLP service.

Exposes three endpoints consumed by the Node.js API proxy (server/index.js):
  GET  /health          — liveness check; reports whether the configured classifier is ready
  POST /nlp/analyze     — main inference endpoint: text → structured flags
  POST /nlp/feedback    — stub endpoint for future human-in-the-loop retraining

All ML and LLM logic is encapsulated in app.pipeline; this module only handles
HTTP serialisation, input validation (via Pydantic models), and error translation.

CORS is currently open (*) — restrict allow_origins to the frontend domain in production
or enforce at the Azure API Management / Application Gateway layer.
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

# Node.js calls to check if the NLP service is up and the model is loaded 
@app.get("/health")
def health():
    """Liveness + whether the configured classifier backend is ready."""
    return {"status": "ok", "model_loaded": is_model_available()}

# Main endpoint it takes the report text, runs it through the analyze_text function in pipeline.py, and returns the structured flags and metadata. If the model isn't available or there's an error during analysis, it raises a 503 Service Unavailable with the error message.
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

# AI helped generate its just a stub doesnt do anything currently but is a placeholder for future retraining
@app.post("/nlp/feedback")
def nlp_feedback(req: FeedbackRequest):
    return {"success": True, "message": "Feedback received."}


if __name__ == "__main__":
    import os
    import uvicorn
    port = int(os.environ.get("PORT", "8000"))
    uvicorn.run(app, host="0.0.0.0", port=port)
