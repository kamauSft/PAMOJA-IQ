@echo off
setlocal
set DATABASE_URL=file:./kwan.db
set DEMO_MODE=false
echo Opening the private KWAN chama on http://localhost:3001
call npx.cmd next dev --port 3001
