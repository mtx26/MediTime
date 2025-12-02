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
    if credentials_obj is None:
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

def send_fcm_notification(tokens: list, title: str, body: str, json_body: dict):
    """Envoie une notification FCM aux tokens spécifiés.

    Paramètres:
    - tokens (list): Liste des tokens d'appareils cibles.
    - title (str): Titre de la notification.
    - body (str): Corps de la notification.
    - json_body (dict): Corps JSON additionnel pour la notification.
    """
    access_token, project_id = get_fcm_access_token()
    url = f"https://fcm.googleapis.com/v1/projects/{project_id}/messages:send"

    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json; UTF-8",
    }

    for token in tokens:
        payload = {
            "message": {
                "token": token,
                "notification": {
                    "title": title,
                    "body": body,
                    "image": urljoin(frontend_url or "", "/icons/icon-192.png")
                },
                "webpush": {
                    "fcm_options": {
                        "link": json_body.get("link") if json_body.get("link") else urljoin(frontend_url or "", "/notifications")
                    }
                }
            }
        }

        response = requests.post(url, headers=headers, json=payload)
        log_backend.info(
            f"send_fcm_notification : {response.status_code}", 
            {
                "origin": "FCM", 
                "code": "FCM_SEND_NOTIFICATION", 
                "status_code": response.status_code,
                "token": token,
                "title": title,
            }
        )
        try:
            data = response.json()
        except Exception as e:
            log_backend.error(
                f"Erreur send_fcm_notification : {e}", 
                {
                    "origin": "FCM", 
                    "code": "FCM_ERROR", 
                    "error": traceback.format_exc()
                }
            )
            data = response.text

        if response.status_code != 200:
            log_backend.error(
                f"Erreur lors de l'envoi de la notification FCM : {response.status_code}",
                {
                    "origin": "FCM",
                    "code": "FCM_SEND_ERROR",
                    "status_code": response.status_code,
                    "token": token,
                    "response": data
                }
            )
