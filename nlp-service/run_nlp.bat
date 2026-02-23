@echo off
title ReportBuilderPro - NLP Service
cd /d "%~dp0"

if exist "venv\Scripts\activate.bat" call venv\Scripts\activate.bat

if not exist "model\vectorizer.joblib" (
    echo Model not found. Run setup_nlp.bat first, or: python -m app.train
    pause
    exit /b 1
)

echo Starting NLP service at http://localhost:8000
echo Docs: http://localhost:8000/docs
uvicorn app.main:app --host 0.0.0.0 --port 8000
pause
