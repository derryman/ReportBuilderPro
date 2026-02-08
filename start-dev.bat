@echo off
REM Batch script to start both servers for development
REM Run this script: start-dev.bat

echo Starting Report Builder Pro servers...
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Error: Node.js is not installed or not in PATH
    pause
    exit /b 1
)

REM Start backend server in a new window
echo Starting backend server on http://localhost:4000
start "ReportBuilderPro Backend" cmd /k "cd server && npm run dev"

REM Wait a moment for backend to start
timeout /t 2 /nobreak >nul

REM Start frontend server in current window
echo Starting frontend server on http://localhost:5173
echo.
echo Press Ctrl+C to stop the frontend server
echo Close the backend window to stop the backend server
echo.
cd web
npm run dev
