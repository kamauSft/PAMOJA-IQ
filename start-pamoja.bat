@echo off
cd /d "%~dp0"
title Pamoja IQ
echo Stopping anything already using port 3000...
for /f "tokens=5" %%p in ('netstat -ano ^| findstr ":3000" ^| findstr "LISTENING"') do taskkill /F /PID %%p >nul 2>&1
if not exist "node_modules\" (
  echo Installing Pamoja IQ. This can take a few minutes.
  call npm install
  if errorlevel 1 goto fail
)
echo Preparing the records...
call npx prisma db push
if errorlevel 1 goto fail
call node scripts/ensure-demo.mjs
if errorlevel 1 goto fail
echo.
echo Pamoja IQ is running. Keep this window open. Close it to stop.
echo.
start "Open Pamoja IQ" /MIN powershell -NoProfile -Command "for ($i=0; $i -lt 90; $i++) { try { $r = Invoke-WebRequest -UseBasicParsing http://localhost:3000/health -TimeoutSec 2; if ($r.StatusCode -eq 200) { Start-Process http://localhost:3000; exit 0 } } catch { Start-Sleep -Seconds 1 } }"
call npm run dev
goto end
:fail
echo.
echo Pamoja IQ did not start. Leave this window open and read the lines above.
pause
:end
