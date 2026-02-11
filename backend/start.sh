#!/bin/bash
# Script de démarrage pour CapRover (une seule app)
# Lance l'API et le Scheduler en parallèle dans le même container

# Lancer le scheduler en arrière-plan
python scheduler.py &

# Lancer l'API en premier plan (4 workers pour 4 CPU, port 5000 pour CapRover)
exec gunicorn -w 4 --threads 2 -b 0.0.0.0:5000 --timeout 120 --access-logfile - --error-logfile - app.main:app
