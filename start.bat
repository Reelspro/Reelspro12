@echo off
echo ==============================================
echo ReelsPro v12 - Startup Script (Windows)
echo ==============================================
echo.

:: Start Backend in a new window
echo Starting Backend Server...
start "ReelsPro Backend" cmd /c "cd backend && call npm.cmd run dev"

:: Start Frontend in a new window
echo Starting Frontend Server...
start "ReelsPro Frontend" cmd /c "cd frontend && call npm.cmd run dev"

echo.
echo Both servers have been launched in separate windows.
echo Close this window at any time.
pause
