# app/__init__.py

from flask import Flask, request
from flask_compress import Compress
from app.config.config import Config
from app.routes import register_routes
from app.core.firebase_init import init_firebase
from app.core.vertex_init import init_vertex_ai
from app.core.db_init import verify_db_connection
# from app.scripts import import_afmps_to_bis
# from app.vertex import test_analyze_medical_document
from flask_cors import CORS
from app.utils.logging import log_backend

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    Compress(app)

    # 🌍 Active CORS avec cookies
    CORS(app, supports_credentials=True)

    # 🔧 Initialisation des services partagés (DB, Firebase, Vertex)
    verify_db_connection()
    init_firebase()
    init_vertex_ai()
    
    # 🔧 Enregistrement des routes
    register_routes(app)
    
    # Note: Le scheduler indépendant (scheduler.py) gère les tâches cron
    # Il s'exécute en parallèle via launch.bat

    # Importation des médicaments AFMPS dans la base de données
    # import_afmps_to_bis("C:/Users/mtx_2/Documents/Code/Medic/MediTime/backend/app/scripts/A.csv")

    return app
