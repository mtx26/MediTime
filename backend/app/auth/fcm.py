import traceback
import requests
from google.auth.transport.requests import Request
from urllib.parse import urljoin
from app.config import Config
from app.utils.logging import log_backend
from app.auth.google_services import get_google_credentials


GOOGLE_APPLICATION_CREDENTIALS = Config.GOOGLE_APPLICATION_CREDENTIALS
frontend_url = Config.FRONTEND_URL

SCOPES = ["https://www.googleapis.com/auth/firebase.messaging"]

def get_fcm_access_token() -> tuple[str | None, str | None]:
    """Obtient un token d'accès FCM en utilisant les informations d'identification Google.

    Retour:
    - tuple: Un tuple contenant le token d'accès (str) et l'ID du projet (str). 
             Si une erreur se produit, retourne (None, None).
    """
    credentials_obj, project_id = get_google_credentials(SCOPES)
    if credentials_obj is None or isinstance(credentials_obj, dict):
        return None, None

    try:
        credentials_obj.refresh(Request())
        return credentials_obj.token, project_id
    except Exception as e:
        log_backend.error(
            f"Erreur lors du refresh du token FCM : {e}",
            {
                "origin": "FCM",
                "code": "FCM_TOKEN_REFRESH_ERROR",
                "error": traceback.format_exc()
            }
        )
        return None, None
