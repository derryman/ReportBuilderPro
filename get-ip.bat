@echo off
REM Batch script to get your local IP address for mobile testing
REM Run this script: get-ip.bat

echo Finding your local IP address...
echo.

REM Get IPv4 addresses
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /i "IPv4"') do (
    set ip=%%a
    set ip=!ip:~1!
    echo   !ip!
)

echo.
echo Mobile Testing URLs:
echo   Frontend: http://[YOUR_IP]:5173
echo   Backend:  http://[YOUR_IP]:4000
echo.
echo To use these URLs:
echo 1. Make sure your phone is on the same WiFi network
echo 2. Start the servers with: npm run dev
echo 3. Replace [YOUR_IP] with one of the IPs shown above
echo.

pause
