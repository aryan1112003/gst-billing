@echo off
:: =============================================================
:: ERP Billing — Deploy to AWS Server from Windows
:: Edit PEM_FILE to your actual .pem file path, then double-click
:: =============================================================

set SERVER=98.90.13.118
set SSH_USER=ec2-user
set PEM_FILE=C:\path\to\your-key.pem

echo.
echo ======================================================
echo   ERP Billing -- Deploying to %SERVER%
echo ======================================================
echo.

:: -- Check .pem file exists
if not exist "%PEM_FILE%" (
  echo ERROR: .pem file not found at: %PEM_FILE%
  echo Please edit this bat file and set PEM_FILE to your .pem path.
  pause
  exit /b 1
)

:: -- Step 1: Copy backend .env to server (first time only)
echo [1/3] Copying backend\.env to server...
scp -i "%PEM_FILE%" -o StrictHostKeyChecking=no "backend\.env" %SSH_USER%@%SERVER%:/home/ec2-user/gst-billing/backend/.env 2>nul
if errorlevel 1 (
  echo   Note: .env copy may have failed - server directory might not exist yet.
  echo   It will be copied after first git clone - continuing...
)

:: -- Step 2: Upload and run deploy.sh on server
echo [2/3] Uploading deploy script...
scp -i "%PEM_FILE%" -o StrictHostKeyChecking=no "deploy.sh" %SSH_USER%@%SERVER%:/home/ec2-user/deploy.sh

echo [3/3] Running deployment on server...
echo.
ssh -i "%PEM_FILE%" -o StrictHostKeyChecking=no %SSH_USER%@%SERVER% "chmod +x /home/ec2-user/deploy.sh && bash /home/ec2-user/deploy.sh"

echo.
echo ======================================================
echo   Done! Check output above for any errors.
echo   Frontend: http://%SERVER%:8081
echo   Backend:  http://%SERVER%:8001/health
echo ======================================================
pause
