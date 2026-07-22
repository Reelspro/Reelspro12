@echo off
:: Hide this window immediately
if not "%MINIMIZED%"=="1" (
    set MINIMIZED=1
    start /min "" cmd /c ""%~f0""
    exit
)

:: Set working directory to where this bat file is
cd /d "%~dp0"

:: Check if node_modules exist, install if not
if not exist "backend\node_modules" (
    echo Installing backend dependencies...
    cd backend
    call npm.cmd install --production
    cd ..
)

:: Start backend server
start "" /b node backend/src/server.js

:: Wait for server to start
timeout /t 3 /nobreak >nul

:: Open browser
start "" http://localhost:5000
