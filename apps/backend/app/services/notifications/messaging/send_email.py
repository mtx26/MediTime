import resend

from app.config import Config
from app.utils.logging import log_backend

EMAIL_BRAND_HEADER = """
<div style="font-family: Arial, sans-serif; background-color: #f9f9f9; padding: 24px;">
  <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
    <div style="background-color: #007bff; padding: 16px; text-align: center;">
      <img src="https://meditime-app.com/icons/logo_white.png" alt="MediTime Logo" style="width: 200px; height: auto; display: block; margin: 0 auto;" />
    </div>
    <div style="padding: 24px;">
"""

EMAIL_BRAND_FOOTER = """
      <div style="margin-top: 30px; font-size: 12px; color: #888; text-align: center; border-top: 1px solid #eee; padding-top: 16px;">
        <a href="https://meditime-app.com/privacy" style="color: #888; text-decoration: none; margin: 0 8px;">Confidentialite</a>
        |
        <a href="https://meditime-app.com/terms" style="color: #888; text-decoration: none; margin: 0 8px;">Conditions d'utilisation</a>
      </div>
    </div>
  </div>
</div>
"""


def _build_sender() -> str:
    sender_email = Config.RESEND_FROM_EMAIL or Config.NOTIFICATION_EMAIL_ADDRESS
    if not sender_email:
        raise RuntimeError("RESEND_FROM_EMAIL est requis pour envoyer des emails avec Resend.")
    if "<" in sender_email and ">" in sender_email:
        return sender_email
    return f"{Config.RESEND_FROM_NAME} <{sender_email}>"


def send_email(to: str, subject: str, html_content: str, plain: str = None):
    """Envoie un email formate avec en-tete et pied de page via Resend."""
    try:
        if not Config.RESEND_API:
            raise RuntimeError("RESEND_API est requis pour envoyer des emails avec Resend.")

        html = (
            EMAIL_BRAND_HEADER
            + f'      <h2 style="color: #333;">{subject}</h2>\n'
            + html_content
            + EMAIL_BRAND_FOOTER
        )

        resend.api_key = Config.RESEND_API
        email = resend.Emails.send(
            {
                "from": _build_sender(),
                "to": [to],
                "subject": subject,
                "html": html,
                "text": plain or "Ce message contient du HTML.",
            }
        )

        log_backend.info(
            "Email envoye avec succes",
            {
                "origin": "EMAIL",
                "code": "EMAIL_SENT",
                "to": to,
                "subject": subject,
                "provider": "resend",
                "email_id": email.get("id") if isinstance(email, dict) else None,
            },
        )
    except Exception as e:
        log_backend.error(
            "Erreur lors de l'envoi de l'email",
            {
                "origin": "EMAIL",
                "code": "EMAIL_ERROR",
                "to": to or "",
                "subject": subject or "",
                "provider": "resend",
                "error": str(e),
            },
        )
