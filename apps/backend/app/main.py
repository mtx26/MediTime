# app.py
"""
Point d'entrée de l'API Flask MediTime.

Ce fichier déclare uniquement l'application Flask et lance le serveur en local.
Les initialisations (DB, Firebase, Vertex) sont dans app/core/.
Le scheduler est dans un processus séparé (scheduler.py).
"""

from flask import Flask
from app import create_app
from app.config import Config
from app.utils.logging import log_backend as logger
import os

# Création de l'application Flask
app = create_app()


# 🚀 Lancement en local uniquement (en production, c'est gunicorn qui sert app.main:app)
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    import sys
    if "--check" in sys.argv:
        print("✔ Flask ready to run")
    else:
        # debug=True active le débogueur Werkzeug, qui permet d'exécuter du code arbitraire.
        # Il ne doit jamais être combiné à une écoute sur 0.0.0.0 hors développement local.
        debug = not Config.IS_PRODUCTION
        host = os.environ.get("FLASK_RUN_HOST", "127.0.0.1" if debug else "0.0.0.0")
        logger.info("Lancement de l'application Flask en local", {
            "origin": "FLASK_START",
            "port": port,
            "host": host,
            "debug": debug
        })
        app.run(host=host, port=port, debug=debug)
