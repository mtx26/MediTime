from app.config import Config
from app.utils.logging import log_backend


def send_sms(to_number, message_body):
    try:
        # Ne rien faire pour l'instant
        pass
    except Exception as e:
        log_backend.error(f"Error sending SMS to {to_number}: {e}", {"origin": "SMS", "code": "SMS_ERROR"})