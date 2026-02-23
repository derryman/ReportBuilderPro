@echo off
title NLP Setup (one-time)
cd /d "%~dp0"

if not exist "venv\Scripts\activate.bat" (
    echo Creating venv...
    python -m venv venv
)
call venv\Scripts\activate.bat

echo Installing dependencies...
pip install -r requirements.txt
python -m spacy download en_core_web_sm

echo Training model...
python -m app.train

echo Done. Run run_nlp.bat to start the service.
pause
