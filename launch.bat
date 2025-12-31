@echo off

:: === Backend API (Flask en développement - Gunicorn ne fonctionne pas sur Windows) ===
start "Backend API" cmd /k "cd /d C:\Users\mtx_2\Documents\Code\Medic\MediTime\backend && .venv\Scripts\activate && pip install -r requirements.txt && python -m app.main"

:: === Scheduler (Python) ===
start "Scheduler" cmd /k "cd /d C:\Users\mtx_2\Documents\Code\Medic\MediTime\backend && .venv\Scripts\activate && python scheduler.py"

:: === Frontend (React) ===
start "Frontend" cmd /k "cd /d C:\Users\mtx_2\Documents\Code\Medic\MediTime\frontend && powershell -Command \"Set-ExecutionPolicy Unrestricted -Scope Process\" && npm install --legacy-peer-deps && npm run dev"
