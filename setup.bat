@echo off
echo ============================================
echo   AI Recruitment - Setup
echo ============================================
echo.

:: ---- Check Python ----
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python not found. Install Python 3.11+ from https://python.org
    pause
    exit /b 1
)
echo [OK] Python found

:: ---- Check Node ----
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js not found. Install Node.js 16+ from https://nodejs.org
    pause
    exit /b 1
)
echo [OK] Node.js found

:: ---- Backend Setup ----
echo.
echo [1/4] Setting up Python virtual environment...
cd /d "%~dp0backend"
python -m venv venv
if errorlevel 1 (
    echo [ERROR] Failed to create virtual environment
    pause
    exit /b 1
)
echo [OK] Virtual environment created

echo.
echo [2/4] Installing backend dependencies (this may take a few minutes)...
call venv\Scripts\activate.bat
pip install --upgrade pip -q
pip install -r requirements.txt
if errorlevel 1 (
    echo [ERROR] Failed to install backend dependencies
    pause
    exit /b 1
)
echo [OK] Backend dependencies installed

:: ---- Create .env if not exists ----
if not exist ".env" (
    echo.
    echo [3/4] Creating .env from .env.example...
    copy .env.example .env >nul
    echo [OK] .env created
    echo.
    echo ============================================
    echo  IMPORTANT: Open backend\.env and set your
    echo  GROQ_API_KEY before running the project!
    echo ============================================
) else (
    echo.
    echo [3/4] .env already exists, skipping...
)

:: ---- Frontend Setup ----
echo.
echo [4/4] Installing frontend dependencies...
cd /d "%~dp0frontend"
call npm install
if errorlevel 1 (
    echo [ERROR] Failed to install frontend dependencies
    pause
    exit /b 1
)
echo [OK] Frontend dependencies installed

echo.
echo ============================================
echo   Setup Complete!
echo.
echo   Next steps:
echo   1. Edit backend\.env and add your GROQ_API_KEY
echo   2. Make sure MongoDB is running
echo   3. Run start.bat to launch the project
echo ============================================
echo.
pause
