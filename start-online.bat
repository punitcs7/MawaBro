@echo off
title MawaBro Public Server
cd /d "%~dp0"
echo ==========================================
echo    Starting MawaBro & LiveKit Cloud Tunnel
echo ==========================================
echo.
echo 1. Freeing port 1420...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":1420" ^| findstr "LISTENING"') do taskkill /f /pid %%a >nul 2>&1

echo 2. Serving compiled production app on port 1420...
start /min cmd /c "npx vite preview --port 1420 --host"

echo 3. Waiting 3 seconds for server to initialize...
timeout /t 3 /nobreak >nul

echo 4. Connecting Public HTTPS Tunnel (No password needed)...
echo ------------------------------------------------------------
echo Look for the link ending in .lhr.life below:
echo Share that link with your friends!
echo Keep this window open while using MawaBro.
echo ------------------------------------------------------------
echo.
ssh -o StrictHostKeyChecking=no -R 80:localhost:1420 nokey@localhost.run
pause
