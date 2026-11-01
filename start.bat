@echo off
REM AQUASENSE-X Startup Script for Windows

echo ================================================================================
echo   AQUASENSE-X - Intelligent Water Purification Platform
echo   Starting Backend and Frontend...
echo ================================================================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python not found. Please install Python 3.12 or higher.
    pause
    exit /b 1
)

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js not found. Please install Node.js 18 or higher.
    pause
    exit /b 1
)

echo.
echo [1/4] Installing backend dependencies...
cd backend
if not exist "venv" (
    echo Creating Python virtual environment...
    python -m venv venv
)
call venv\Scripts\activate.bat
pip install -q -r requirements.txt
if errorlevel 1 (
    echo ERROR: Failed to install backend dependencies
    pause
    exit /b 1
)
cd ..

echo.
echo [2/4] Installing frontend dependencies...
cd frontend
if not exist "node_modules" (
    echo Installing npm packages...
    call npm install
    if errorlevel 1 (
        echo ERROR: Failed to install frontend dependencies
        cd ..
        pause
        exit /b 1
    )
)
cd ..

echo.
echo [3/4] Starting Backend API Server on http://localhost:8000
start "AQUASENSE-X Backend" cmd /k "cd backend && venv\Scripts\activate.bat && python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"

REM Wait for backend to start
echo Waiting for backend to initialize...
timeout /t 5 /nobreak >nul

echo.
echo [4/4] Starting Frontend Dev Server on http://localhost:5173
start "AQUASENSE-X Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo ================================================================================
echo   AQUASENSE-X is starting up!
echo.
echo   Backend API:  http://localhost:8000
echo   API Docs:     http://localhost:8000/docs
echo   Frontend:     http://localhost:5173
echo.
echo   Wait a few seconds for both servers to initialize...
echo   The frontend will open automatically once ready.
echo.
echo   Press Ctrl+C in each window to stop the servers.
echo ================================================================================
echo.
pause
