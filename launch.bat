@echo off

:: === Backend API (Flask en développement - Gunicorn ne fonctionne pas sur Windows) ===
start "Backend API" cmd /k "cd /d C:\Users\mtx_2\Documents\Code\Medic\MediTime\apps\backend && .venv\Scripts\activate && pip install -r requirements.txt && python -m app.main"

:: === Scheduler (Python) ===
start "Scheduler" cmd /k "cd /d C:\Users\mtx_2\Documents\Code\Medic\MediTime\apps\backend && .venv\Scripts\activate && python scheduler.py"

:: === Frontend (React) - Monorepo ===
start "Frontend" cmd /k "cd /d C:\Users\mtx_2\Documents\Code\Medic\MediTime && npm install && npm run dev --workspace=apps/web"
