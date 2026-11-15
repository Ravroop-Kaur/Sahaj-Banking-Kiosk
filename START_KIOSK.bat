@echo off
setlocal
cd /d "%~dp0"
echo ===============================================
echo SAHAJ - BANKING MADE SIMPLE
echo Synthetic demo. No money moves.
echo ===============================================
where python >nul 2>nul
if errorlevel 1 (
  echo Install Python 3.10 or newer from python.org and enable Add Python to PATH.
  pause
  exit /b 1
)
python run_kiosk.py --open-existing
if errorlevel 2 goto occupied
if not errorlevel 1 exit /b 0
if not exist .venv\Scripts\python.exe (
  echo Preparing your local Python environment...
  python -m venv .venv
  if errorlevel 1 goto fail
)
echo Checking project dependencies. Internet is needed on the first run.
.venv\Scripts\python.exe -m pip install -r requirements.txt
if errorlevel 1 goto fail
if not exist .env if exist .env.example copy .env.example .env >nul
echo Opening Sahaj when the server is ready. Keep this window open.
echo To stop Sahaj, press Ctrl+C in this window.
.venv\Scripts\python.exe run_kiosk.py
if errorlevel 1 goto fail
pause
exit /b 0
:occupied
echo Check the existing server window and retry.
pause
exit /b 1
:fail
echo Setup could not finish. Read the error above and check Python and your connection.
echo If this folder contains a copied .venv, extract the original ZIP to a new folder and retry.
pause
exit /b 1
