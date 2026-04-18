@echo off
title NLP unit tests
cd /d "%~dp0"

if not exist "venv\Scripts\activate.bat" (
  echo No venv in this folder. One-time setup:
  echo   Run setup_nlp.bat
  echo or:  python -m venv venv
  echo       venv\Scripts\activate
  echo       pip install -r requirements.txt
  echo       python -m spacy download en_core_web_sm
  exit /b 1
)

call venv\Scripts\activate.bat
python -m unittest discover -s tests
set EXITCODE=%errorlevel%
if %EXITCODE% neq 0 echo.
if %EXITCODE% neq 0 echo If you see ModuleNotFoundError, run: pip install -r requirements.txt
exit /b %EXITCODE%
