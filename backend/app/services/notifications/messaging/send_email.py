import smtplib
from email.message import EmailMessage
from email.utils import formataddr
from app.utils.logging import log_backend
from app.config import Config

def send_email(to: str, subject: str, html_content: str, plain: str | None = None):
    """Envoie un email formaté avec en-tête et pied de page.

    Paramètres:
    - to (str): Adresse email du destinataire.
    - subject (str): Sujet de l'email.
    - html_content (str): Contenu HTML de l'email.
    - plain (str, optional): Contenu texte brut de l'email. Par défaut None.
    """
    try:
        html = f"""
            <div style="font-family: Arial, sans-serif; background-color: #f9f9f9; padding: 24px;">
                <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
                    <div style="background-color: #007bff; padding: 16px; text-align: center;">
                        <img src="https://meditime-app.com/icons/logo_white.png" alt="MediTime Logo" style="max-height: 100px; height: auto; width: auto; display: inline-block;" />
                    </div>
                    <div style="padding: 24px;">
                        <h2 style="color: #333;">{subject}</h2>
                        {html_content}
                        
                        
                        <!-- Pied de page -->
                        <div style="margin-top: 30px; font-size: 12px; color: #888; text-align: center; border-top: 1px solid #eee; padding-top: 16px;">
                            <a href="https://meditime-app.com/privacy" style="color: #888; text-decoration: none; margin: 0 8px;">
                                Confidentialité
                            </a>
                            |
                            <a href="https://meditime-app.com/terms" style="color: #888; text-decoration: none; margin: 0 8px;">
                                Conditions d'utilisation
                            </a>
                        </div>
                    </div>
                </div>
            </div>

            """
        msg = EmailMessage()
        msg["Subject"] = subject
        msg["From"] = formataddr(("MediTime", Config.NOTIFICATION_EMAIL_ADDRESS or ""))
        msg["To"] = to
        msg.set_content(plain or "Ce message contient du HTML.")
        msg.add_alternative(html, subtype="html")

        with smtplib.SMTP(Config.SMTP_HOST or "", int(Config.SMTP_PORT or 465)) as server:
            server.starttls()
            server.login(Config.NOTIFICATION_EMAIL_ADDRESS or "", Config.NOTIFICATION_EMAIL_PASSWORD or "")
            server.send_message(msg)
        log_backend.info("Email envoyé avec succès", {
            "origin": "EMAIL",
            "code": "EMAIL_SENT",
            "to": to,
            "subject": subject
        })
    except Exception as e:
        log_backend.error("Erreur lors de l'envoi de l'email", {
            "origin": "EMAIL",
            "code": "EMAIL_ERROR",
            "to": to or "",
            "subject": subject or "",
            "error": str(e)
        })