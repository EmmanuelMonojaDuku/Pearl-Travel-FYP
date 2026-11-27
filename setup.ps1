# Pearl Travel one-time setup for Windows PowerShell.
# Usage (from the project folder):  powershell -ExecutionPolicy Bypass -File .\setup.ps1
$ErrorActionPreference = 'Stop'
function Secret { -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 48 | ForEach-Object { [char]$_ }) }

Write-Host "1/5 Checking PostgreSQL..." -ForegroundColor Yellow
if (-not (Get-Command psql -ErrorAction SilentlyContinue)) {
  Write-Host "PostgreSQL (psql) was not found. Install it, then open a NEW PowerShell window and run this script again:" -ForegroundColor Red
  Write-Host "  winget install PostgreSQL.PostgreSQL.16"
  Write-Host "During the install, remember the password you choose for the 'postgres' user."
  exit 1
}

$pw = Read-Host "Enter your PostgreSQL 'postgres' password"
$env:PGPASSWORD = $pw
Write-Host "2/5 Creating the database..." -ForegroundColor Yellow
$exists = & psql -U postgres -h localhost -tAc "SELECT 1 FROM pg_database WHERE datname='pearl_travel'"
if ($exists -ne '1') { & psql -U postgres -h localhost -c "CREATE DATABASE pearl_travel" | Out-Null }

Write-Host "3/5 Writing api\.env..." -ForegroundColor Yellow
if (-not (Test-Path api\.env)) {
  $enc = [uri]::EscapeDataString($pw)
  $envText = Get-Content api\.env.example -Raw
  $envText = $envText -replace '(?m)^DATABASE_URL=.*$', "DATABASE_URL=postgresql://postgres:$enc@localhost:5432/pearl_travel"
  $envText = $envText -replace '(?m)^DB_SSL_MODE=.*$', 'DB_SSL_MODE=disable'
  $envText = $envText -replace '(?m)^JWT_ACCESS_SECRET=.*$', ("JWT_ACCESS_SECRET=" + (Secret))
  $envText = $envText -replace '(?m)^JWT_REFRESH_SECRET=.*$', ("JWT_REFRESH_SECRET=" + (Secret))
  $envText = $envText -replace '(?m)^CORS_ORIGINS=.*$', 'CORS_ORIGINS=http://localhost:3000'
  Set-Content -Path api\.env -Value $envText -Encoding UTF8
} else { Write-Host "api\.env already exists, keeping it." }

Write-Host "4/5 Installing packages (this takes a few minutes)..." -ForegroundColor Yellow
npm install
Push-Location api
npm install
Write-Host "5/5 Creating tables and demo accounts..." -ForegroundColor Yellow
npm run migrate
npm run seed:demo
Pop-Location

Write-Host ""
Write-Host "Done. Start the app with:  npm run dev:full   then open http://localhost:3000" -ForegroundColor Green
Write-Host "Demo password: PearlDemo#2026 (Traveller / Officer / Admin buttons on the login screen)."
