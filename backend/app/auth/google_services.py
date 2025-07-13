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
    if firebase_admin._apps:
        log_backend.info("Firebase déjà initialisé", {"origin": "FIREBASE_INIT"})
        return

    service_account_raw = Config.GOOGLE_APPLICATION_CREDENTIALS

    if not service_account_raw:
        log_backend.error("Aucune clé de service Firebase trouvée dans .env", {
            "origin": "FIREBASE_INIT"
        })
        raise RuntimeError("GOOGLE_APPLICATION_CREDENTIALS manquant")

    try:
        service_account_dict = json.loads(service_account_raw)
    except json.JSONDecodeError as e:
        log_backend.error("Erreur JSON dans GOOGLE_APPLICATION_CREDENTIALS", {
            "origin": "FIREBASE_INIT",
            "error": str(e)
        })
        raise RuntimeError("GOOGLE_APPLICATION_CREDENTIALS invalide")

    cred = credentials.Certificate(service_account_dict)
    firebase_admin.initialize_app(cred)
    log_backend.info("Firebase initialisé avec JSON depuis .env", {
        "origin": "FIREBASE_INIT"
    })


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

        log_backend.info("Vertex AI initialisé avec succès", {
            "origin": "VERTEX_INIT",
            "project": project_id,
            "location": location
        })

    except Exception as e:
        log_backend.error("Erreur lors de l'initialisation de Vertex AI", {
            "origin": "VERTEX_INIT",
            "code": "VERTEX_INIT_ERROR",
            "error": str(e)
        })
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
            f"Erreur get_google_credentials : {e}",
            {
                "origin": "AUTH",
                "code": "GOOGLE_CREDENTIALS_ERROR",
                "error": traceback.format_exc()
            }
        )
        return None, None
