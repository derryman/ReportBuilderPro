# PowerShell script to start both servers for development
# Run this script: .\start-dev.ps1

Write-Host "Starting Report Builder Pro servers..." -ForegroundColor Green
Write-Host ""

# Check if Node.js is installed
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "Error: Node.js is not installed or not in PATH" -ForegroundColor Red
    exit 1
}

# Check if dependencies are installed
if (-not (Test-Path "server/node_modules")) {
    Write-Host "Installing server dependencies..." -ForegroundColor Yellow
    Set-Location server
    npm install
    Set-Location ..
}

if (-not (Test-Path "web/node_modules")) {
    Write-Host "Installing web dependencies..." -ForegroundColor Yellow
    Set-Location web
    npm install
    Set-Location ..
}

# Start both servers concurrently
Write-Host "Starting backend server on http://localhost:4000" -ForegroundColor Cyan
Write-Host "Starting frontend server on http://localhost:5173" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press Ctrl+C to stop both servers" -ForegroundColor Yellow
Write-Host ""

# Start backend server in background
$backend = Start-Process -FilePath "node" -ArgumentList "server/index.js" -PassThru -NoNewWindow

# Start frontend server
Set-Location web
npm run dev

# Cleanup: kill backend if frontend stops
Stop-Process -Id $backend.Id -ErrorAction SilentlyContinue
Set-Location ..
