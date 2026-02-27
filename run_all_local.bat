@echo off
title ReportBuilderPro - Run All Local
cd /d "%~dp0"

echo.
echo Starting ReportBuilderPro (Node API + NLP + Web)...
echo.
echo Make sure server\.env has: NLP_SERVICE_URL=http://localhost:8000
echo.

REM Start Node backend (port 4000)
start "RBP Node API" cmd /k "cd /d "%~dp0server" && npm start"
timeout /t 2 /nobreak >nul

REM Start Python NLP service (port 8000)
start "RBP NLP" cmd /k "cd /d "%~dp0nlp-service" && if exist venv\Scripts\activate.bat (call venv\Scripts\activate.bat && uvicorn app.main:app --host 0.0.0.0 --port 8000) else (echo Create venv first: cd nlp-service ^& run setup_nlp.bat && pause)"
timeout /t 2 /nobreak >nul

REM Start Vite web app (port 5173)
start "RBP Web" cmd /k "cd /d "%~dp0web" && npm run dev"

echo.
echo All three windows should be open.
echo.
echo   Node API:    http://localhost:4000
echo   NLP service: http://localhost:8000
echo   Web app:     http://localhost:5173  (open this in your browser)
echo.
echo Log in, create a report, then use Risk Detection to scan it.
echo Close each window to stop that part, or close all to stop everything.
echo.
pause
