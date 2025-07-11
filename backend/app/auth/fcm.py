import traceback
import requests
from google.auth.transport.requests import Request
from urllib.parse import urljoin
from app.config import Config
from app.utils.logger import log_backend
from app.auth.google_services import get_google_credentials


GOOGLE_APPLICATION_CREDENTIALS = Config.GOOGLE_APPLICATION_CREDENTIALS
frontend_url = Config.FRONTEND_URL

SCOPES = ["https://www.googleapis.com/auth/firebase.messaging"]

def get_fcm_access_token():
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

def send_fcm_notification(tokens, title, body, json_body):
    access_token, project_id = get_fcm_access_token()
    url = f"https://fcm.googleapis.com/v1/projects/{project_id}/messages:send"

    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json; UTF-8",
    }

    errors = []
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
            errors.append({
                "token": token,
                "status_code": response.status_code,
                "response": data
            })

    return errors
