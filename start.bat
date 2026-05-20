@echo off
title بازاڕی رێگاکانی کوردستان
color 0A
echo.
echo  ====================================================
echo     🌿 بازاڕی رێگاکانی کوردستان - دەستپێکردن
echo  ====================================================
echo.

:: Start MongoDB service
echo [1/3] دەستپێکردنی MongoDB...
net start MongoDB >nul 2>&1
if %errorlevel% == 0 (
    echo  ✅ MongoDB دەستیپێکرد
) else (
    echo  ⚠️  MongoDB پێشتر دەستیپێکردووە یان هەڵەیەک هەیە
)

timeout /t 2 /nobreak >nul

:: Start Backend in new window
echo [2/3] دەستپێکردنی Backend...
start "Backend - Port 5000" cmd /k "cd /d "%~dp0backend" && npm run dev"
timeout /t 3 /nobreak >nul

:: Start Frontend in new window
echo [3/3] دەستپێکردنی Frontend...
start "Frontend - Port 3000" cmd /k "cd /d "%~dp0frontend" && npm start"

echo.
echo  ====================================================
echo  ✅ سیستەمەکە دەستیپێکرد!
echo.
echo  🌐 بەرنامەکە: http://localhost:3000
echo  🔧 API:       http://localhost:5000
echo  ====================================================
echo.
pause
