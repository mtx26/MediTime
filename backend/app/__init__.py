# app/__init__.py

from flask import Flask, request
from flask_compress import Compress
from app.config.config import Config
from app.routes import register_routes
from app.auth.google_services import init_firebase, init_vertex_ai
from app.scripts import import_afmps_to_bis
# from app.vertex import test_analyze_medical_document
from flask_cors import CORS
from app.cron import start_cron

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    Compress(app)

    # 🌍 Active CORS avec cookies si jamais Firebase envoie une session (optionnel)
    CORS(app, supports_credentials=True)

    # 🔧 Enregistrement des routes et services
    register_routes(app)
    init_firebase()
    init_vertex_ai()
    start_cron()

    # Importation des médicaments AFMPS dans la base de données
    # import_afmps_to_bis("C:/Users/mtx_2/Documents/Code/Medic/MediTime/backend/app/scripts/A.csv")

    @app.after_request
    def add_cache_headers(response):
        path = request.path
        if any(ext in path for ext in [".js", ".css", ".png", ".webp", ".avif", ".ico"]) and "v=" in request.query_string.decode():
            response.headers['Cache-Control'] = 'public, max-age=31536000, immutable'
        elif path.endswith('.html'):
            response.headers['Cache-Control'] = 'no-store'
        return response

    return app
