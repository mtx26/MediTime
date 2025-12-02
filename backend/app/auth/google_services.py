import json
import traceback
import firebase_admin
from firebase_admin import credentials
from google.oauth2 import service_account
from google.cloud import aiplatform

from app.config.config import Config
from app.utils.logging import log_backend

def init_firebase():
    """Initialise Firebase avec les credentials de l'env.
    """
    try:
        if firebase_admin._apps:
            log_backend.info("Firebase déjà initialisé", {
                "origin": "FIREBASE_INIT",
                "code": "FIREBASE_INIT_ALREADY_INITIALIZED"
            })
            return

        service_account_dict, project_id = get_google_credentials()

        if not service_account_dict:
            raise RuntimeError("Impossible de récupérer les credentials Firebase")

        cred = credentials.Certificate(service_account_dict)

        firebase_admin.initialize_app(cred)
        log_backend.info("Firebase initialisé avec succès", {
            "origin": "FIREBASE_INIT",
            "code": "FIREBASE_INIT_SUCCESS",
            "project_id": project_id
        })
        
    except Exception as e:
        log_backend.error("Erreur lors de l'initialisation de Firebase", {
            "origin": "FIREBASE_INIT",
            "code": "FIREBASE_INIT_ERROR",
            "error": str(e)
        })
        raise RuntimeError("Initialisation Firebase échouée")


def init_vertex_ai():
    """Initialise Vertex AI avec les credentials de l'env.
    """
    try:
        scopes = ["https://www.googleapis.com/auth/cloud-platform"]
        credentials_obj, project_id = get_google_credentials(scopes)

        if not credentials_obj or not project_id:
            raise RuntimeError("Échec de récupération des identifiants Google")

        location = Config.GOOGLE_CLOUD_LOCATION
        if not location:
             raise RuntimeError("GOOGLE_CLOUD_LOCATION manquant dans .env")

        aiplatform.init(
            project=project_id,
            location=location,
            credentials=credentials_obj
        )

        log_backend.info("Vertex AI initialisé avec succès", {
            "origin": "VERTEX_INIT",
            "code": "VERTEX_INIT_SUCCESS",
            "project_id": project_id,
            "location": location
        })

    except Exception as e:
        log_backend.error("Erreur lors de l'initialisation de Vertex AI", {
            "origin": "VERTEX_INIT",
            "code": "VERTEX_INIT_ERROR",
            "error": str(e)
        })
        raise RuntimeError("Initialisation Vertex AI échouée")


def get_google_credentials(scopes: list = None) -> tuple[service_account.Credentials | dict | None, str | None]:
    """Récupère les informations d'identification Google à partir des variables d'environnement.

    Paramètres:
    - scopes (list, optionnel): Liste des scopes OAuth2 requis.
    
    Retour:
    - tuple: Si scopes est fourni, retourne (credentials_obj, project_id).
             Sinon, retourne (service_account_dict, project_id).
    """
    try:
        raw_credentials = Config.GOOGLE_APPLICATION_CREDENTIALS
        if not raw_credentials:
            raise ValueError("Aucune clé de service fournie")

        service_account_info = json.loads(raw_credentials)
        project_id = service_account_info.get("project_id")

        if scopes:
            credentials_obj = service_account.Credentials.from_service_account_info(
                service_account_info, scopes=scopes
            )
            return credentials_obj, project_id
        
        return service_account_info, project_id

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
