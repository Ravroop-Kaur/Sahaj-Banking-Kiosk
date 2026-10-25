@echo off
setlocal
cd /d "%~dp0"
echo ===============================================
echo SAHAJ DEMO BANKING KIOSK - SYNTHETIC DEMO ONLY
echo ===============================================
where python >nul 2>nul
if errorlevel 1 (
  echo Python was not found. Install Python 3.10+ from https://www.python.org/downloads/ and enable Add Python to PATH.
  pause
  exit /b 1
)
REM Rebuild a copied or damaged virtual environment. Never reuse one copied from another computer.
if exist .venv\pyvenv.cfg (
  findstr /b /c:"home =" .venv\pyvenv.cfg >nul
  if errorlevel 1 (
    echo The existing .venv is incomplete. Recreating it...
    rmdir /s /q .venv
  )
)
if exist .venv\pyvenv.cfg (
  findstr /b /c:"home =" .venv\pyvenv.cfg >nul
  if errorlevel 1 (
    echo Could not remove the broken .venv. Close VS Code and any running Python process, then delete the .venv folder manually.
    pause
    exit /b 1
  )
)
if not exist .venv\Scripts\python.exe (
  echo Creating local Python environment...
  python -m venv .venv
  if errorlevel 1 goto fail
)
echo Installing or updating requirements...
.venv\Scripts\python.exe -m pip install --upgrade pip
if errorlevel 1 goto fail
.venv\Scripts\python.exe -m pip install -r requirements.txt
if errorlevel 1 goto fail
if not exist .env if exist .env.example copy .env.example .env >nul
start "Banking Kiosk" http://127.0.0.1:8766
.venv\Scripts\python.exe -m uvicorn main:app --host 127.0.0.1 --port 8766
pause
exit /b 0
:fail
echo Setup failed. Read the error above and check your Python installation and internet connection.
pause
exit /b 1
