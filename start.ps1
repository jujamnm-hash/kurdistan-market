#!/usr/bin/env pwsh
# Start Kurdistan Roadside Market System

Write-Host ""
Write-Host "  ====================================================" -ForegroundColor Green
Write-Host "    🌿 بازاڕی رێگاکانی کوردستان - دەستپێکردن" -ForegroundColor Green
Write-Host "  ====================================================" -ForegroundColor Green
Write-Host ""

$root = Split-Path -Parent $MyInvocation.MyCommand.Path

# Start MongoDB
Write-Host "[1/3] دەستپێکردنی MongoDB..." -ForegroundColor Cyan
try {
    Start-Service -Name "MongoDB" -ErrorAction Stop
    Write-Host "  ✅ MongoDB دەستیپێکرد" -ForegroundColor Green
} catch {
    Write-Host "  ⚠️  MongoDB پێشتر چالاکە یان دامەزراو نیە" -ForegroundColor Yellow
}

Start-Sleep -Seconds 2

# Start Backend
Write-Host "[2/3] دەستپێکردنی Backend (port 5000)..." -ForegroundColor Cyan
$backendPath = Join-Path $root "backend"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$backendPath'; npm run dev" -WindowStyle Normal

Start-Sleep -Seconds 3

# Start Frontend
Write-Host "[3/3] دەستپێکردنی Frontend (port 3000)..." -ForegroundColor Cyan
$frontendPath = Join-Path $root "frontend"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$frontendPath'; npm start" -WindowStyle Normal

Write-Host ""
Write-Host "  ====================================================" -ForegroundColor Green
Write-Host "  ✅ سیستەمەکە دەستیپێکرد!" -ForegroundColor Green
Write-Host ""
Write-Host "  🌐 بەرنامەکە: http://localhost:3000" -ForegroundColor White
Write-Host "  🔧 API:       http://localhost:5000/api" -ForegroundColor White
Write-Host "  ====================================================" -ForegroundColor Green
Write-Host ""
