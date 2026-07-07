@echo off
echo ============================================
echo   AI Recruitment - Starting Servers
echo ============================================
echo.

:: ---- Check .env exists ----
if not exist "%~dp0backend\.env" (
    echo [ERROR] backend\.env not found. Run setup.bat first.
    pause
    exit /b 1
)

:: ---- Check MongoDB ----
echo Checking MongoDB...
sc query MongoDB >nul 2>&1
if errorlevel 1 (
    echo [WARNING] MongoDB service not detected. Make sure MongoDB is running.
    echo           If using MongoDB Compass, open it now.
    echo.
    timeout /t 3 /nobreak >nul
) else (
    net start MongoDB >nul 2>&1
    echo [OK] MongoDB started
)

:: ---- Start Backend in new window ----
echo.
echo Starting Backend (http://localhost:8000)...
start "Backend - FastAPI" cmd /k "cd /d %~dp0backend && call venv\Scripts\activate.bat && python -m uvicorn src.main:app --reload --host 0.0.0.0 --port 8000"

:: ---- Wait a moment for backend to initialize ----
timeout /t 3 /nobreak >nul

:: ---- Start Frontend in new window ----
echo Starting Frontend (http://localhost:5173)...
start "Frontend - Vite" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo ============================================
echo   Both servers are starting!
echo.
echo   Backend:  http://localhost:8000
echo   API Docs: http://localhost:8000/docs
echo   Frontend: http://localhost:5173
echo.
echo   Close the opened terminal windows to stop.
echo ============================================
echo.

:: Open browser after a short delay
timeout /t 5 /nobreak >nul
start http://localhost:5173
