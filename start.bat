@echo off
chcp 65001 >nul
title LoveMatch Dating Platform

echo.
echo  ╔══════════════════════════════════════════════════════════╗
echo  ║           🩷 LoveMatch Dating Platform 🩷                ║
echo  ║                                                          ║
echo  ║   Backend:  http://localhost:5000                        ║
echo  ║   Frontend: http://localhost:3000                        ║
echo  ╚══════════════════════════════════════════════════════════╝
echo.

REM Check if .env exists
if not exist ".env" (
    echo [ERROR] .env file not found!
    echo Please copy .env.example to .env and configure it.
    pause
    exit /b 1
)

REM Check Python
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python is not installed or not in PATH
    pause
    exit /b 1
)

REM Check Node
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js is not installed or not in PATH
    pause
    exit /b 1
)

echo [1/2] Starting Backend Server on port 5000...
cd backend
start "LoveMatch Backend" cmd /c "python run.py"
cd ..

echo [2/2] Starting Frontend Server on port 3000...
cd frontend
start "LoveMatch Frontend" cmd /c "npm run dev"
cd ..

timeout /t 3 /nobreak >nul

echo.
echo  ╔══════════════════════════════════════════════════════════╗
echo  ║   ✅ Servers are starting!                               ║
echo  ║                                                          ║
echo  ║   🔗 Open: http://localhost:3000                         ║
echo  ║                                                          ║
echo  ║   Press ENTER to stop all servers...                     ║
echo  ╚══════════════════════════════════════════════════════════╝
echo.

pause >nul

echo.
echo Stopping servers...
taskkill /FI "WindowTitle eq LoveMatch Backend*" /T /F >nul 2>&1
taskkill /FI "WindowTitle eq LoveMatch Frontend*" /T /F >nul 2>&1
echo Done!
