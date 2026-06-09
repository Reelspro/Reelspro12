@echo off
echo ==============================================
echo ReelsPro v12 - Developer Setup Script (Windows)
echo ==============================================
echo This script uses npm.cmd directly to avoid PowerShell Execution Policy restrictions.

echo.
echo Installing Backend Dependencies...
cd backend
call npm.cmd install
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Backend npm install failed!
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo Building Backend (Running migrations)...
call npm.cmd run build
cd ..

echo.
echo Installing Frontend Dependencies...
cd frontend
call npm.cmd install
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Frontend npm install failed!
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo Setup Complete! 
echo Run 'start.bat' to launch the application.
pause
