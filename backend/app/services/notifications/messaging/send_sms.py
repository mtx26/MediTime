from twilio.rest import Client
from app.config import Config
from app.utils.logging import log_backend


def send_sms(to_number, message_body):
    try:
        client = Client(Config.TWILIO_API_KEY_SID, Config.TWILIO_API_KEY_SECRET)
        message = client.messages.create(
            to=to_number,
            messaging_service_sid=Config.TWILIO_MESSAGING_SERVICE_SID,
            body=message_body
        )
        log_backend.info(
            "sms envoyé",
            {"origin": "SMS", "code": "SMS_SENT", "to": to_number},
        )
    except Exception as e:
        log_backend.error(
            "erreur envoi SMS",
            {"origin": "SMS", "code": "SMS_ERROR", "to": to_number, "error": str(e)},
        )
        return {"success": False, "error": str(e)}
    return {"success": True, "sid": message.sid, "status": message.status}
