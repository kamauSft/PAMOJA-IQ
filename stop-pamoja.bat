@echo off
cd /d "%~dp0"
echo Closing Pamoja IQ...
for /f "tokens=5" %%p in ('netstat -ano ^| findstr ":3000" ^| findstr "LISTENING"') do taskkill /F /PID %%p >nul 2>&1
echo Port 3000 is free.
echo You can close this window.
pause
