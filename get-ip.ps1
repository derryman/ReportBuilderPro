# PowerShell script to get your local IP address for mobile testing
# Run this script: .\get-ip.ps1

Write-Host "Finding your local IP address..." -ForegroundColor Green
Write-Host ""

# Get IPv4 addresses (excluding loopback and link-local)
$ipAddresses = Get-NetIPAddress -AddressFamily IPv4 | 
    Where-Object { 
        $_.IPAddress -notlike "127.*" -and 
        $_.IPAddress -notlike "169.254.*" -and
        $_.InterfaceAlias -notlike "*Loopback*"
    } | 
    Select-Object IPAddress, InterfaceAlias

if ($ipAddresses.Count -eq 0) {
    Write-Host "No network interfaces found. Make sure you're connected to WiFi." -ForegroundColor Yellow
    exit 1
}

Write-Host "Your local IP addresses:" -ForegroundColor Cyan
Write-Host ""
foreach ($ip in $ipAddresses) {
    Write-Host "  $($ip.IPAddress) - $($ip.InterfaceAlias)" -ForegroundColor White
}

Write-Host ""
Write-Host "Mobile Testing URLs:" -ForegroundColor Cyan
Write-Host ""
foreach ($ip in $ipAddresses) {
    $ipAddr = $ip.IPAddress
    Write-Host "  Frontend: http://$ipAddr`:5173" -ForegroundColor Green
    Write-Host "  Backend:  http://$ipAddr`:4000" -ForegroundColor Green
}

Write-Host ""
Write-Host "To use these URLs:" -ForegroundColor Yellow
Write-Host "1. Make sure your phone is on the same WiFi network"
Write-Host "2. Start the servers with: npm run dev"
Write-Host "3. Set VITE_API_URL environment variable before starting:"
Write-Host "   `$env:VITE_API_URL='http://$($ipAddresses[0].IPAddress):4000'; npm run dev"
Write-Host ""
Write-Host "Or create a .env file in the web/ directory with:"
Write-Host "   VITE_API_URL=http://$($ipAddresses[0].IPAddress):4000"
Write-Host ""
