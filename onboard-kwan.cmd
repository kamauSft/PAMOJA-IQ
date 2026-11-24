@echo off
setlocal
if "%~3"=="" (
  echo Usage: onboard-kwan.cmd "C:\path\to\KWAN register.xlsx" "Treasurer Name" 07xxxxxxxx
  exit /b 1
)
set DATABASE_URL=file:./kwan.db
set DEMO_MODE=false
call npx.cmd prisma db push --skip-generate || exit /b 1
call npx.cmd tsx scripts/onboard-kwan.ts --workbook "%~1" --out "%TEMP%\kwan-credentials.csv" --db file:./kwan.db --treasurer-name "%~2" --treasurer-phone "%~3"
