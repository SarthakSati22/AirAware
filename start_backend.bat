@echo off
cd /d "%~dp0"
echo ===================================================
echo Starting AirAware FastAPI Backend Server...
echo ===================================================

if exist "C:\Users\SARTHAK\AppData\Local\Programs\Python\Python313\python.exe" (
    "C:\Users\SARTHAK\AppData\Local\Programs\Python\Python313\python.exe" run_backend.py
) else (
    py -3.13 run_backend.py || python run_backend.py
)

pause
