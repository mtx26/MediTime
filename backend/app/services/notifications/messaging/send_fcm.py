import traceback
import requests
from urllib.parse import urljoin
from app.config import Config
from app.utils.logging import log_backend
from app.auth.fcm import get_fcm_access_token
from app.db.connection import get_connection


frontend_url = Config.FRONTEND_URL

def delete_fcm_token(token: str):
    """Supprime un token FCM de la base de données.

    Paramètres:
    - token (str): Le token FCM à supprimer.
    """
    with get_connection(skip_rls=True) as conn:
        with conn.cursor() as cursor:
            cursor.execute("DELETE FROM fcm_tokens WHERE token = %s", (token,))
            conn.commit()

def _create_fcm_payload(token: str, title: str, body: str, json_body: dict) -> dict:
    """
    Crée le payload pour la notification FCM.

    Paramètres:
    - token (str): Le token de l'appareil cible.
    - title (str): Le titre de la notification.
    - body (str): Le corps de la notification.
    - json_body (dict): Le corps JSON additionnel pour la notification.

    Retour:
    - dict: Le payload de la notification FCM.
    """
    return {
        "message": {
            "token": token,
            "notification": {
                "title": title,
                "body": body,
                "image": urljoin(frontend_url or "", "/icons/icon-192.png")
            },
            "webpush": {
                "fcm_options": {
                    "link": f"{Config.FRONTEND_URL}{json_body.get('link') or f'/notifications'}"
                }
            }
        }
    }

def send_fcm_notification(tokens: list, title: str, plain_body: str, context: dict):
    """Envoie une notification FCM aux tokens spécifiés.

    Paramètres:
    - tokens (list): Liste des tokens d'appareils cibles.
    - title (str): Titre de la notification.
    - plain_body (str): Corps de la notification en texte brut.
    - context (dict): Corps JSON additionnel pour la notification.
    """
    access_token, project_id = get_fcm_access_token()
    url = f"https://fcm.googleapis.com/v1/projects/{project_id}/messages:send"

    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json; UTF-8",
    }

    for token in tokens:
        payload = _create_fcm_payload(token, title, plain_body, context)

        response = requests.post(url, headers=headers, json=payload)
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
            
        if response.status_code == 404:
            delete_fcm_token(token)
            log_backend.info(
                f"Token FCM supprimé car introuvable : {token}",
                {
                    "origin": "FCM",
                    "code": "FCM_TOKEN_DELETED",
                    "token": token,
                }
            )
        elif response.status_code != 200:
            log_backend.error(
                f"Erreur FCM {response.status_code} pour token {token}",
                {
                    "origin": "FCM",
                    "code": "FCM_SEND_ERROR",
                    "status_code": response.status_code,
                    "token": token,
                    "error": data,
                }
            )
        else:
            log_backend.info(
                f"Notification FCM envoyée avec succès au token : {token}",
                {
                    "origin": "FCM",
                    "code": "FCM_SEND_SUCCESS",
                    "token": token,
                }
            )
