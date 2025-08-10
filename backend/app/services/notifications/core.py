# app/services/notifications.py
import json
import traceback
from typing import List, Tuple, Dict, Any

from app.auth.fcm import send_fcm_notification
from app.db.connection import get_connection
from app.services.calendar import fetch_calendar, fetch_medicine_name
from app.services.notifications.messaging import send_email, send_sms
from app.services.user import fetch_user
from app.utils.logging import log_backend
from app.config import Config


# ---------- Helpers de données ----------
def fetch_user_name(uid: str | None) -> str:
    if not uid:
        return "un utilisateur"
    user = fetch_user(uid)
    return user.get("display_name") if user else "un utilisateur"


def fetch_calendar_name(calendar_id: str | None) -> str | None:
    if not calendar_id:
        return None
    calendar = fetch_calendar(calendar_id)
    return calendar.get("name") if calendar else "unknown"


def enrich_notification(notification: Dict[str, Any]) -> Dict[str, Any]:
    """Ajoute les noms du calendrier et de l’expéditeur."""
    try:
        notification["calendar_name"] = fetch_calendar_name(notification.get("calendar_id"))
        notification["sender_name"] = fetch_user_name(notification.get("sender_uid"))
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


# ---------- Construction des contenus ----------
def _format_medication_list(meds: List[Dict[str, Any]]) -> str:
    rows = "".join(
        f"""
        <tr>
            <td style="padding:4px 8px;">{m.get('name')}</td>
            <td style="padding:4px 8px; color: {'red' if float(m.get('qty', 0)) <= 0 else 'orange'}; font-weight:bold;">
                {float(m.get('qty', 0)):+g}
            </td>
        </tr>
        """
        for m in meds
    )
    return f"""
        <table style="border-collapse:collapse; margin-top:8px;">
            <thead>
                <tr>
                    <th align="left" style="padding:4px 8px;">Médicament</th>
                    <th align="left" style="padding:4px 8px;">Stock</th>
                </tr>
            </thead>
            <tbody>{rows}</tbody>
        </table>
    """


def build_notification_text(notif_type: str, data: Dict[str, Any]) -> Tuple[str, str]:
    """Retourne (title/subject, body) HTML/texte court pour push/SMS/e-mail."""
    match notif_type:
        case "calendar_invitation":
            return (
                "📆 Nouvelle invitation à un calendrier",
                f"<b>{data.get('sender_name')}</b> vous invite à rejoindre le calendrier « <b>{data.get('calendar_name')}</b> ».",
                "Accepter l'invitation"
            )
        case "calendar_invitation_registration":
            return (
                "📆 Invitation à s'inscrire",
                f"<b>{data.get('sender_name')}</b> vous invite à vous inscrire pour le calendrier « <b>{data.get('calendar_name')}</b> ».",
                "S'inscrire et accepter l'invitation"
            )
        case "calendar_invitation_accepted":
            return (
                "✅ Invitation acceptée",
                f"<b>{data.get('sender_name')}</b> a accepté votre invitation pour « <b>{data.get('calendar_name')}</b> ».",
                "Voir le calendrier"
            )
        case "calendar_invitation_rejected":
            return (
                "❌ Invitation refusée",
                f"<b>{data.get('sender_name')}</b> a refusé votre invitation pour « <b>{data.get('calendar_name')}</b> ».",
                "Voir le calendrier"
            )
        case "calendar_shared_deleted_by_owner":
            return (
                "🔒 Partage annulé",
                f"<b>{data.get('sender_name')}</b> a arrêté de partager « <b>{data.get('calendar_name')}</b> » avec vous.",
                "Voir le calendrier"
            )
        case "calendar_shared_deleted_by_receiver":
            return (
                "📤 Partage retiré",
                f"<b>{data.get('sender_name')}</b> a retiré le calendrier « <b>{data.get('calendar_name')}</b> » de votre compte.",
                "Voir le calendrier"
            )
        case "low_stock":
            calendar = data.get("calendar_name") or "ce calendrier"
            title = f"⚠️ Stock faible – calendrier « {calendar} »"
            if data.get("medications"):
                body = f"<p>Certains médicaments du calendrier <b>« {calendar} »</b> sont en stock critique :</p>"
                body += _format_medication_list(data["medications"])
                return (
                    title, 
                    body,
                    "Voir le calendrier"
                )
            # cas 1 médicament
            name = fetch_medicine_name(data.get("medication_id"))
            qty = data.get("medication_qty") or 0
            if qty == 0:
                stock_txt = "<span style='color:red;font-weight:bold;'>épuisé</span>"
            else:
                stock_txt = f"<span style='color:orange;font-weight:bold;'>{qty} restant{'s' if qty != 1 else ''}</span>"
            return (
                title, 
                f"Le médicament <b>« {name} »</b> est {stock_txt}.",
                "Voir le calendrier"
            )
        case _:
            count = data.get("notification_count")
            if count and count > 1:
                return (
                    "🔔 Nouvelles notifications", 
                    f"Vous avez <b>{count}</b> nouvelles notifications dans MediTime.",
                    "Voir les notifications"
                )
            return (
                "🔔 Nouvelle notification", 
                "Vous avez reçu une nouvelle notification dans MediTime.",
                "Voir les notifications"
            )


def generate_email_content(notif_type: str, json_body: Dict[str, Any]) -> Tuple[str, str, str]:
    subject, body, button_text = build_notification_text(notif_type, json_body)
    link = json_body.get("link") or f"{Config.FRONTEND_URL}/notifications"
    html = f"""
        <p style="font-size:16px;color:#555;white-space:pre-line;">{body}</p>
        <div style="margin:32px 0;">
            <a href="{link}" style="background-color:#007bff;color:#fff;text-decoration:none;padding:12px 20px;border-radius:4px;display:inline-block;">
                {button_text or "Voir mes notifications"}
            </a>
        </div>
        <p style="font-size:13px;color:#999;">
            Si le bouton ne fonctionne pas, copiez-collez ce lien :
            <a href="{link}" style="color:#007bff;">{link}</a>
        </p>
    """
    return f"MediTime - {subject}", body, html


# ---------- Persistance web ----------
def save_notifications(uid: str, notif_type: str, notifications: List[Dict[str, Any]]) -> None:
    """Enregistre chaque notification (historique Web)."""
    try:
        with get_connection() as conn, conn.cursor() as cur:
            for notif in notifications:
                title, body, _ = build_notification_text(notif_type, notif)
                content = {**notif, "title": title, "body": body}
                cur.execute(
                    """
                    INSERT INTO notifications (user_id, type, read, timestamp, sender_uid, content)
                    VALUES (%s, %s, %s, NOW(), %s, %s::jsonb)
                    """,
                    (uid, notif_type, False, notif.get("sender_uid"), json.dumps(content)),
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


# ---------- Envois par canal ----------
def _get_fcm_tokens(uid: str) -> List[str]:
    with get_connection() as conn, conn.cursor() as cur:
        cur.execute("SELECT token FROM fcm_tokens WHERE uid = %s", (uid,))
        return [r["token"] for r in cur.fetchall()]


def send_push_notification(uid: str, payload: Dict[str, Any], notif_type: str) -> None:
    title, body, _ = build_notification_text(notif_type, payload)
    tokens = _get_fcm_tokens(uid)
    if tokens:
        send_fcm_notification(tokens, title, body, payload)
    else:
        log_backend.warning(
            f"Aucun token FCM trouvé pour l'utilisateur {uid}",
            {"origin": "NOTIFICATIONS", "code": "NO_FCM_TOKEN", "uid": uid},
        )


def send_email_notification(user: Dict[str, Any], payload: Dict[str, Any], notif_type: str) -> None:
    email = user.get("email")
    if not email:
        log_backend.warning(
            "Aucun email pour l'utilisateur",
            {"origin": "NOTIFICATIONS", "code": "NO_EMAIL", "uid": user.get("id")},
        )
        return
    subject, plain_body, html_content = generate_email_content(notif_type, payload)
    send_email(to=email, subject=subject, html_content=html_content, plain=plain_body)


def send_sms_notification(user: Dict[str, Any], payload: Dict[str, Any], notif_type: str) -> None:
    phone = user.get("phone")
    if not phone:
        log_backend.warning(
            "Aucun numéro de téléphone",
            {"origin": "NOTIFICATIONS", "code": "NO_PHONE_NUMBER", "uid": user.get("id")},
        )
        return
    # Pour SMS, on réutilise le body "court"
    _, plain_body, _ = build_notification_text(notif_type, payload)
    send_sms(phone, plain_body)


# ---------- Orchestration ----------
def send_grouped_notifications(uid: str, notifications: List[Dict[str, Any]], notif_type: str, channels: List[str]) -> None:
    """Envoie push/email/SMS une seule fois (groupé) et enregistre côté web si demandé."""
    try:
        user = fetch_user(uid) or {}
        email_enabled = user.get("email_enabled")
        push_enabled = user.get("push_enabled")
        sms_enabled = user.get("sms_enabled")

        # Charge utile groupée
        payload = notifications[0].copy()
        if notif_type == "low_stock":
            payload["medications"] = [
                {"name": fetch_medicine_name(n.get("medication_id")), "qty": n.get("medication_qty") or 0}
                for n in notifications
            ]
        elif len(notifications) > 1:
            payload["notification_count"] = len(notifications)

        if "web" in channels:
            save_notifications(uid, notif_type, notifications)
        if push_enabled and "push" in channels:
            send_push_notification(uid, payload, notif_type)
        if email_enabled and "email" in channels:
            send_email_notification(user, payload, notif_type)
        if sms_enabled and "sms" in channels:
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


def notify_and_record(uid: str, json_body: Dict[str, Any] | List[Dict[str, Any]], notif_type: str, channels: List[str] = ("push", "email", "web")) -> None:
    """Gère 1..n notifications pour un utilisateur + enregistrement Web par défaut."""
    try:
        notifications = json_body if isinstance(json_body, list) else [json_body]
        enriched = [enrich_notification(n) for n in notifications]
        send_grouped_notifications(uid, enriched, notif_type, list(channels))
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


# ---------- NOUVEAU : envoyer "juste un e-mail" à une adresse donnée ----------
def email_address_direct(to_email: str, notif_type: str, payload: Dict[str, Any]) -> None:
    """
    Envoie un e-mail à une adresse arbitraire (hors préférences utilisateur),
    en réutilisant le même build (titres/corps) que le système standard.
    N’enregistre rien en base et n’envoie ni push ni SMS.
    """
    try:
        # On enrichit pour garder les noms cohérents dans les templates
        enriched = enrich_notification(payload.copy())
        subject, plain_body, html_content = generate_email_content(notif_type, enriched)
        send_email(to=to_email, subject=subject, html_content=html_content, plain=plain_body)
    except Exception as e:
        log_backend.error(
            "Erreur email_address_direct",
            {
                "origin": "NOTIFICATIONS",
                "code": "DIRECT_EMAIL_ERROR",
                "to": to_email,
                "notif_type": notif_type,
                "error": str(e),
                "trace": traceback.format_exc(),
            },
        )
