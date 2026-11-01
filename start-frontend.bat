@echo off
REM AQUASENSE-X Frontend Startup Script

echo ================================================================================
echo   AQUASENSE-X Frontend - Starting Development Server
echo ================================================================================
echo.

cd frontend

REM Check if node_modules exists
if not exist "node_modules" (
    echo Installing frontend dependencies...
    call npm install
    if errorlevel 1 (
        echo ERROR: Failed to install dependencies
        pause
        exit /b 1
    )
)

echo.
echo ================================================================================
echo   Starting Frontend Development Server
echo
echo   Frontend: http://localhost:5173
echo
echo   Make sure the backend is running on http://localhost:8000
echo
echo   Press Ctrl+C to stop the server
echo ================================================================================
echo.

REM Start Vite dev server
call npm run dev
