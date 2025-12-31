# app.py
"""
Point d'entrée de l'API Flask MediTime.

Ce fichier déclare uniquement l'application Flask et lance le serveur en local.
Les initialisations (DB, Firebase, Vertex) sont dans app/core/.
Le scheduler est dans un processus séparé (scheduler.py).
"""

from flask import Flask
from app import create_app
from app.utils.logging import log_backend as logger
import os

# Création de l'application Flask
app = create_app()


# 🚀 Lancement en local ou sur Render
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    import sys
    if "--check" in sys.argv:
        print("✔ Flask ready to run")
    else:
        logger.info("Lancement de l'application Flask en local", {
            "origin": "FLASK_START",
            "port": port
        })
        app.run(host="0.0.0.0", port=port)
