#!/bin/bash
# Script de démarrage pour CapRover (une seule app)
# Lance l'API et le Scheduler en parallèle dans le même container

# Lancer le scheduler en arrière-plan
python scheduler.py &

# Lancer l'API en premier plan (9 workers pour 4 CPU)
exec gunicorn -w 9 --threads 2 -b 0.0.0.0:80 --timeout 120 --access-logfile - --error-logfile - app.main:app
