@echo off
title FRC Team 172 Dashboard
cd /d "%~dp0"

echo ============================================
echo   FRC Team 172 - Dashboard Launcher
echo ============================================
echo.

:: Sync paths from robot code
echo Syncing paths from robot code...
call node scripts/sync-paths.js
echo.

:: Start the dev server in the background with path watcher
echo Starting dashboard server on port 5800...
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo Node.js not found. Installing Node.js LTS via winget...
    where winget >nul 2>&1
    if %errorlevel% neq 0 (
        echo winget is not available. Please install Node.js manually:
        echo https://nodejs.org/
        pause
        exit /b 1
    )
    winget install --id OpenJS.NodeJS.LTS -e --accept-package-agreements --accept-source-agreements
    if %errorlevel% neq 0 (
        echo Failed to install Node.js via winget.
        pause
        exit /b 1
    )
    echo Node.js installed successfully.
)

start /b cmd /c "node scripts/sync-paths.js --watch"
start /b cmd /c "npx vite --host"

:: Wait for server to be ready
timeout /t 4 /nobreak >nul

:: Open in browser (fullscreen-friendly)
echo Opening dashboard in browser...
start http://localhost:5800

echo.
echo Dashboard is running at http://localhost:5800
echo Press Ctrl+C to stop.
echo.

:: Keep window open
pause
