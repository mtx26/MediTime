import os
import json
import traceback

import firebase_admin
from firebase_admin import credentials
from google.oauth2 import service_account
from google.cloud import aiplatform

from app.config.config import Config
from app.utils.logging import log_backend


def init_firebase():
    """Initialise Firebase Admin SDK à partir du JSON dans l'env."""
    try:
        if firebase_admin._apps:
            log_backend.info(
                "firebase déjà initialisé",
                {"origin": "FIREBASE_INIT", "code": "FIREBASE_INIT_ALREADY"},
            )
            return

        service_account_raw = Config.GOOGLE_APPLICATION_CREDENTIALS

        if not service_account_raw:
            log_backend.error(
                "clé de service firebase manquante",
                {"origin": "FIREBASE_INIT", "code": "FIREBASE_INIT_MISSING"},
            )
            raise RuntimeError("GOOGLE_APPLICATION_CREDENTIALS manquant")

        service_account_dict = json.loads(service_account_raw)
        
        cred = credentials.Certificate(service_account_dict)
        firebase_admin.initialize_app(cred)
        log_backend.info(
            "firebase initialisé",
            {"origin": "FIREBASE_INIT", "code": "FIREBASE_INIT_SUCCESS"},
        )
        
    except Exception as e:
        log_backend.error(
            "erreur initialisation firebase",
            {"origin": "FIREBASE_INIT", "code": "FIREBASE_INIT_ERROR", "error": str(e)},
        )
        raise RuntimeError("Initialisation Firebase échouée")


def init_vertex_ai():
    """Initialise Vertex AI avec les credentials de l'env."""
    try:
        scopes = ["https://www.googleapis.com/auth/cloud-platform"]
        credentials, project_id = get_google_credentials(scopes)

        if not credentials or not project_id:
            raise RuntimeError("Échec de récupération des identifiants Google")

        location = Config.GOOGLE_CLOUD_LOCATION

        aiplatform.init(
            project=project_id,
            location=location,
            credentials=credentials
        )

        log_backend.info(
            "vertex ai initialisé",
            {
                "origin": "VERTEX_INIT",
                "code": "VERTEX_INIT_SUCCESS",
                "project": project_id,
                "location": location,
            },
        )

    except Exception as e:
        log_backend.error(
            "erreur initialisation vertex ai",
            {"origin": "VERTEX_INIT", "code": "VERTEX_INIT_ERROR", "error": str(e)},
        )
        raise RuntimeError("Initialisation Vertex AI échouée")


def get_google_credentials(scopes):
    """Extrait les credentials Google et le project_id depuis le .env."""
    try:
        raw_credentials = Config.GOOGLE_APPLICATION_CREDENTIALS
        if not raw_credentials:
            raise ValueError("Aucune clé de service fournie")

        service_account_info = json.loads(raw_credentials)
        credentials_obj = service_account.Credentials.from_service_account_info(
            service_account_info, scopes=scopes
        )
        return credentials_obj, service_account_info.get("project_id")

    except Exception as e:
        log_backend.error(
            "erreur get_google_credentials",
            {
                "origin": "AUTH",
                "code": "GOOGLE_CREDENTIALS_ERROR",
                "error": traceback.format_exc(),
            },
        )
        return None, None
