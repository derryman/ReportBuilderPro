# FastAPI NLP service - Python, spaCy, scikit-learn
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
    return {"status": "ok", "model_loaded": is_model_available()}


@app.post("/nlp/analyze")
def nlp_analyze(req: AnalyzeRequest):
    if not req.text or not req.text.strip():
        raise HTTPException(status_code=400, detail="Text is required")
    try:
        result = analyze_text(req.text)
        return {"analysis_id": None, "flags": result["flags"], "metadata": result["metadata"]}
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))


@app.post("/nlp/feedback")
def nlp_feedback(req: FeedbackRequest):
    return {"success": True, "message": "Feedback received."}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
