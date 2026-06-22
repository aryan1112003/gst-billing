@echo off
echo Starting ERP Business Management App for Android
echo ================================================
echo.

echo Step 1: Checking if Metro is running...
netstat -ano | findstr :8081 >nul
if %errorlevel% equ 0 (
    echo Metro is already running on port 8081
    echo.
) else (
    echo Metro is not running. Please start it in another terminal with:
    echo   cd frontend
    echo   npx expo start --clear
    echo.
    pause
    exit /b 1
)

echo Step 2: Starting Android app...
echo.
npx expo start --android

echo.
echo Done!
pause
