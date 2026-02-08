# PowerShell script to start servers for mobile testing
# This script finds your IP and sets up the environment for mobile access
# Run this script: .\start-dev-mobile.ps1

Write-Host "Setting up mobile testing environment..." -ForegroundColor Green
Write-Host ""

# Get local IP address
$ipAddresses = Get-NetIPAddress -AddressFamily IPv4 | 
    Where-Object { 
        $_.IPAddress -notlike "127.*" -and 
        $_.IPAddress -notlike "169.254.*" -and
        $_.InterfaceAlias -notlike "*Loopback*"
    } | 
    Select-Object IPAddress, InterfaceAlias

if ($ipAddresses.Count -eq 0) {
    Write-Host "Error: No network interfaces found. Make sure you're connected to WiFi." -ForegroundColor Red
    exit 1
}

$localIP = $ipAddresses[0].IPAddress

Write-Host "Found local IP: $localIP" -ForegroundColor Cyan
Write-Host ""
Write-Host "Mobile Testing URLs:" -ForegroundColor Yellow
Write-Host "  Frontend: http://$localIP`:5173" -ForegroundColor Green
Write-Host "  Backend:  http://$localIP`:4000" -ForegroundColor Green
Write-Host ""
Write-Host "Make sure your phone is on the same WiFi network!" -ForegroundColor Yellow
Write-Host ""

# Create/update .env file in web directory
$envFile = "web\.env"
$envContent = "VITE_API_URL=http://$localIP`:4000"

if (Test-Path $envFile) {
    $existing = Get-Content $envFile -Raw
    if ($existing -notmatch "VITE_API_URL") {
        Add-Content $envFile "`n$envContent"
        Write-Host "Updated web/.env file with mobile API URL" -ForegroundColor Cyan
    } else {
        Write-Host "web/.env already contains VITE_API_URL" -ForegroundColor Yellow
    }
} else {
    Set-Content $envFile $envContent
    Write-Host "Created web/.env file with mobile API URL" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "Starting servers..." -ForegroundColor Green
Write-Host "Press Ctrl+C to stop both servers" -ForegroundColor Yellow
Write-Host ""

# Start both servers
npm run dev
