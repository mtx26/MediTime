# app.py
from flask import Flask, jsonify
from flask_cors import CORS
from app.config.config import Config
from app.utils.logging import log_backend as logger
import os
from app.db.connection import get_connection
from app import create_app

app = create_app()


# 🚀 Lancement en local ou sur Render
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    import sys
    if "--check" in sys.argv:
        print("✔ Flask ready to run")
    else:
        app.run(host="0.0.0.0", port=port)
        logger.info(
            "application flask démarrée",
            {"origin": "FLASK_START", "code": "FLASK_START_LOCAL", "port": port},
        )