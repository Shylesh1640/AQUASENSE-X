@echo off
REM AQUASENSE-X Backend Startup Script

echo ================================================================================
echo   AQUASENSE-X Backend - Starting API Server
echo ================================================================================
echo.

cd backend

REM Check if virtual environment exists
if not exist "venv" (
    echo Creating Python virtual environment...
    python -m venv venv
    if errorlevel 1 (
        echo ERROR: Failed to create virtual environment
        pause
        exit /b 1
    )
)

REM Activate virtual environment
call venv\Scripts\activate.bat

REM Install dependencies if needed
echo Checking dependencies...
python -c "import fastapi" 2>nul
if errorlevel 1 (
    echo Installing backend dependencies...
    pip install -q -r requirements.txt
    if errorlevel 1 (
        echo ERROR: Failed to install dependencies
        pause
        exit /b 1
    )
)

echo.
echo ================================================================================
echo   Starting Backend API Server
echo
echo   API: http://localhost:8000
echo   API Docs: http://localhost:8000/docs
echo   Health Check: http://localhost:8000/api/v1/system/health
echo
echo   Press Ctrl+C to stop the server
echo ================================================================================
echo.

REM Start uvicorn server
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
