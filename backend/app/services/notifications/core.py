# app/services/notifications.py
import json
from app.auth.fcm import send_fcm_notification
from app.db.connection import get_connection
from app.services.calendar import fetch_calendar, fetch_medicine_name
from app.services.notifications.messaging import send_email, send_sms
from app.services.user import fetch_user
from app.utils.logging import log_backend
from app.config import Config
import traceback

def fetch_user_name(uid):
    user = fetch_user(uid)
    return user.get("display_name") if user else "un utilisateur"

def fetch_calendar_name(calendar_id):
    calendar = fetch_calendar(calendar_id)
    return calendar.get("name") if calendar else "unknown"


def enrich_notification(notification: dict) -> dict:
    """Add calendar and sender names to the notification."""
    try:
        calendar_id = notification.get("calendar_id")
        sender_uid = notification.get("sender_uid")

        notification["calendar_name"] = (
            fetch_calendar_name(calendar_id) if calendar_id else None
        )
        notification["sender_name"] = fetch_user_name(sender_uid)
    except Exception as e:
        log_backend.error(
            "Erreur enrich_notification",
            {
                "origin": "NOTIFICATIONS",
                "code": "ENRICH_ERROR",
                "notification": notification,
                "error": str(e),
                "trace": traceback.format_exc(),
            },
        )
    return notification


def build_notification_text(notif_type: str, data: dict) -> tuple[str, str]:
    """Return title/subject and body for a notification."""
    def format_medication_list(meds: list[dict]) -> str:
        rows = ""
        for med in meds:
            name = med["name"]
            val = float(med["qty"])
            color = "red" if val <= 0 else "orange"
            rows += f"""
                <tr>
                    <td style="padding: 4px 8px;">{name}</td>
                    <td style="padding: 4px 8px; color: {color}; font-weight: bold;">{val:+g}</td>
                </tr>
            """
        return f"""
            <table style="border-collapse: collapse; margin-top: 8px;">
                <thead>
                    <tr>
                        <th align="left" style="padding: 4px 8px;">Médicament</th>
                        <th align="left" style="padding: 4px 8px;">Stock</th>
                    </tr>
                </thead>
                <tbody>
                    {rows}
                </tbody>
            </table>
        """

    match notif_type:
        case "calendar_invitation":
            title = "📆 Nouvelle invitation à un calendrier"
            body = (
                f"<b>{data.get('sender_name')}</b> vous invite à rejoindre le calendrier "
                f"« <b>{data.get('calendar_name')}</b> »."
            )

        case "calendar_invitation_accepted":
            title = "✅ Invitation acceptée"
            body = (
                f"<b>{data.get('sender_name')}</b> a accepté votre invitation pour le calendrier "
                f"« <b>{data.get('calendar_name')}</b> »."
            )

        case "calendar_invitation_rejected":
            title = "❌ Invitation refusée"
            body = (
                f"<b>{data.get('sender_name')}</b> a refusé votre invitation pour le calendrier "
                f"« <b>{data.get('calendar_name')}</b> »."
            )

        case "calendar_shared_deleted_by_owner":
            title = "🔒 Partage annulé"
            body = (
                f"<b>{data.get('sender_name')}</b> a arrêté de partager le calendrier "
                f"« <b>{data.get('calendar_name')}</b> » avec vous."
            )

        case "calendar_shared_deleted_by_receiver":
            title = "📤 Partage retiré"
            body = (
                f"<b>{data.get('sender_name')}</b> a retiré le calendrier "
                f"« <b>{data.get('calendar_name')}</b> » de votre compte."
            )

        case "low_stock":
            calendar = data.get("calendar_name") or "ce calendrier"
            title = f"⚠️ Stock faible – calendrier « {calendar} »"

            if data.get("medications"):
                med_lines = data["medications"]
                body = f"<p>Certains médicaments du calendrier <b>« {calendar} »</b> sont en stock critique :</p>"
                body += format_medication_list(med_lines)
            else:
                name = fetch_medicine_name(data.get("medication_id"))
                qty = data.get("medication_qty") or 0

                if qty == 0:
                    stock_text = f"<span style='color:red;font-weight:bold;'>épuisé</span>"
                else:
                    plural = "s" if qty != 1 else ""
                    stock_text = (
                        f"<span style='color:orange;font-weight:bold;'>{qty} restant{plural}</span>"
                    )

                body = f"Le médicament <b>« {name} »</b> a {stock_text}."

        case _:
            count = data.get("notification_count")
            if count and count > 1:
                title = "🔔 Nouvelles notifications"
                body = f"Vous avez <b>{count}</b> nouvelles notifications dans MediTime."
            else:
                title = "🔔 Nouvelle notification"
                body = "Vous avez reçu une nouvelle notification dans MediTime."

    return title, body

def save_notifications(uid: str, notif_type: str, notifications: list[dict]):
    """Persist notifications individually to the database."""
    try:
        with get_connection() as conn:
            with conn.cursor() as cursor:
                for notif in notifications:
                    cursor.execute(
                        """
                        INSERT INTO notifications (user_id, type, read, timestamp, sender_uid, content)
                        VALUES (%s, %s, %s, NOW(), %s, %s::jsonb)
                        """,
                        (uid, notif_type, False, notif.get("sender_uid"), json.dumps(notif)),
                    )
                conn.commit()
    except Exception as e:
        log_backend.error(
            "Erreur save_notifications",
            {
                "origin": "NOTIFICATIONS",
                "code": "SAVE_ERROR",
                "uid": uid,
                "error": str(e),
                "trace": traceback.format_exc(),
            },
        )


def send_grouped_notifications(uid: str, notifications: list[dict], notif_type: str) -> None:
    """Send push/email/SMS once for all notifications."""
    try:
        user = fetch_user(uid)
        email_enabled = user.get("email_enabled")
        push_enabled = user.get("push_enabled")
        sms_enabled = user.get("sms_enabled")

        payload = notifications[0].copy()
        if notif_type == "low_stock":
            payload["medications"] = [
                {
                    "name": fetch_medicine_name(n.get("medication_id")),
                    "qty": n.get("medication_qty") or 0
                }
                for n in notifications
            ]
        elif len(notifications) > 1:
            payload["notification_count"] = len(notifications)

        if push_enabled:
            send_push_notification(uid, payload, notif_type)
        if email_enabled:
            send_email_notification(user, payload, notif_type)
        if sms_enabled:
            send_sms_notification(user, payload, notif_type)
    except Exception as e:
        log_backend.error(
            "Erreur send_grouped_notifications",
            {
                "origin": "NOTIFICATIONS",
                "code": "SEND_ERROR",
                "uid": uid,
                "error": str(e),
                "trace": traceback.format_exc(),
            },
        )

def send_push_notification(uid: str, payload: dict, notif_type: str) -> None:
    """Send an FCM notification."""
    title, body = build_notification_text(notif_type, payload)

    with get_connection() as conn:
        with conn.cursor() as cursor:
            cursor.execute("SELECT token FROM fcm_tokens WHERE uid = %s", (uid,))
            tokens = [r["token"] for r in cursor.fetchall()]

    if tokens:
        send_fcm_notification(tokens, title, body, payload)
    else:
        log_backend.warning(
            f"Aucun token FCM trouvé pour l'utilisateur {uid}",
            {"origin": "NOTIFICATIONS", "code": "NO_FCM_TOKEN", "uid": uid},
        )

def send_email_notification(user: dict, payload: dict, notif_type: str) -> None:
    email = user.get("email")
    if not email:
        log_backend.warning(
            f"Aucun email trouvé pour l'utilisateur {user.get('id')}",
            {"origin": "NOTIFICATIONS", "code": "NO_EMAIL", "uid": user.get('id')},
        )
        return

    subject, plain_body, html_content = generate_email_content(notif_type, payload)

    send_email(to=email, subject=subject, html_content=html_content, plain=plain_body)

def send_sms_notification(user: dict, payload: dict, notif_type: str) -> None:
    phone = user.get("phone")
    if not phone:
        log_backend.warning(
            f"Aucun numéro de téléphone trouvé pour l'utilisateur {user.get('id')}",
            {
                "origin": "NOTIFICATIONS",
                "code": "NO_PHONE_NUMBER",
                "uid": user.get('id'),
            },
        )
        return

    plain_body = build_notification_text(notif_type, payload)[1]
    send_sms(phone, plain_body)

def generate_email_content(notif_type: str, json_body: dict) -> tuple[str, str, str]:
    base_link = f"https://{Config.FRONTEND_URL}/notifications"

    subject, body = build_notification_text(notif_type, json_body)

    html_content = f"""
        <p style="font-size: 16px; color: #555; white-space: pre-line;">{body}</p>
        <div style="margin: 32px 0;">
            <a href="{base_link}" style="background-color: #007bff; color: white; text-decoration: none; padding: 12px 20px; border-radius: 4px; display: inline-block;">
            Voir mes notifications
            </a>
        </div>
        <p style="font-size: 13px; color: #999;">Si le bouton ne fonctionne pas, copiez-collez ce lien dans votre navigateur :<br/>
            <a href="{base_link}" style="color: #007bff;">{base_link}</a>
        </p>
    """

    return f"MediTime - {subject}", body, html_content




def notify_and_record(uid: str, json_body, notif_type: str) -> None:
    """Handle single or multiple notifications for a user."""
    try:
        notifications = json_body if isinstance(json_body, list) else [json_body]

        enriched = [enrich_notification(n) for n in notifications]

        save_notifications(uid, notif_type, enriched)
        send_grouped_notifications(uid, enriched, notif_type)

    except Exception as e:
        log_backend.error(
            "Erreur notify_and_record",
            {
                "origin": "NOTIFICATIONS",
                "code": "NOTIFICATION_ERROR",
                "uid": uid,
                "error": str(e),
                "trace": traceback.format_exc(),
            },
        )