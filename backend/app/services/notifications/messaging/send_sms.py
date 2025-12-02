from app.config import Config
from app.utils.logging import log_backend


def send_sms(to_number: str, message_body: str):
    """Envoie un SMS.

    Paramètres:
    - to_number (str): Numéro de téléphone du destinataire.
    - message_body (str): Contenu du message SMS.
    """
    try:
        # Ne rien faire pour l'instant
        pass
    except Exception as e:
        log_backend.error(f"Error sending SMS to {to_number}: {e}", {"origin": "SMS", "code": "SMS_ERROR"})