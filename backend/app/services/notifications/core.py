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

# ========= Constantes =========
ORIGIN = "NOTIFICATIONS"
DEFAULT_CHANNELS: Tuple[str, ...] = ("push", "email", "web")

# ========= Types =========
NotificationDict = Dict[str, Any]


# ========= Helpers de données =========
def fetch_user_name(user_id: str | None) -> str:
    if not user_id:
        return "un utilisateur"
    user = fetch_user(user_id)
    return user.get("display_name") if user else "un utilisateur"


def fetch_calendar_name(calendar_id: str | None) -> str | None:
    if not calendar_id:
        return None
    calendar = fetch_calendar(calendar_id)
    return calendar.get("name") if calendar else "unknown"


def enrich_notification(notification: NotificationDict) -> NotificationDict:
    """Ajoute les noms du calendrier et de l’expéditeur au payload."""
    try:
        notification["calendar_name"] = fetch_calendar_name(notification.get("calendar_id"))
        notification["sender_name"] = fetch_user_name(notification.get("sender_uid"))
    except Exception as e:
        log_backend.error(
            "Erreur enrich_notification",
            {
                "origin": ORIGIN,
                "code": "ENRICH_ERROR",
                "notification": notification,
                "error": str(e),
                "trace": traceback.format_exc(),
            },
        )
    return notification


# ========= Construction des contenus =========
def _format_medication_list(medications: List[NotificationDict]) -> str:
    rows = "".join(
        f"""
        <tr>
            <td style="padding:4px 8px;">{m.get('name')}</td>
            <td style="padding:4px 8px; color: {'red' if float(m.get('qty', 0)) <= 0 else 'orange'}; font-weight:bold;">
                {float(m.get('qty', 0)):+g}
            </td>
        </tr>
        """
        for m in medications
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


def build_notification_text(notification_type: str, context: NotificationDict) -> Tuple[str, str, str]:
    """
    Retourne (title, body_html, cta_label) pour push/SMS/e-mail.
    - title: utilisé pour push et sujet d’e-mail (avec préfixe côté e-mail)
    - body_html: HTML concis (SMS utilisera un extrait sans formatage si besoin)
    - cta_label: texte du bouton (email) ou deep-link
    """
    match notification_type:
        case "calendar_invitation":
            return (
                "📆 Nouvelle invitation à un calendrier",
                f"<b>{context.get('sender_name')}</b> vous invite à rejoindre le calendrier « <b>{context.get('calendar_name')}</b> ».",
                "Accepter l'invitation",
            )

        case "calendar_invitation_registration":
            return (
                "📆 Invitation à s'inscrire",
                f"<b>{context.get('sender_name')}</b> vous invite à vous inscrire pour le calendrier « <b>{context.get('calendar_name')}</b> ».",
                "S'inscrire et accepter l'invitation",
            )

        case "calendar_invitation_accepted":
            return (
                "✅ Invitation acceptée",
                f"<b>{context.get('sender_name')}</b> a accepté votre invitation pour « <b>{context.get('calendar_name')}</b> ».",
                "Voir le calendrier",
            )

        case "calendar_invitation_rejected":
            return (
                "❌ Invitation refusée",
                f"<b>{context.get('sender_name')}</b> a refusé votre invitation pour « <b>{context.get('calendar_name')}</b> ».",
                "Voir le calendrier",
            )

        case "calendar_shared_deleted_by_owner":
            return (
                "🔒 Partage annulé",
                f"<b>{context.get('sender_name')}</b> a arrêté de partager « <b>{context.get('calendar_name')}</b> » avec vous.",
                "Voir le calendrier",
            )

        case "calendar_shared_deleted_by_receiver":
            return (
                "📤 Partage retiré",
                f"<b>{context.get('sender_name')}</b> a retiré le calendrier « <b>{context.get('calendar_name')}</b> » de votre compte.",
                "Voir le calendrier",
            )

        case "low_stock":
            calendar_name = context.get("calendar_name") or "ce calendrier"
            title = f"⚠️ Stock faible – calendrier « {calendar_name} »"

            if context.get("medications"):
                body_html = f"<p>Certains médicaments du calendrier <b>« {calendar_name} »</b> sont en stock critique :</p>"
                body_html += _format_medication_list(context["medications"])
                return (title, body_html, "Voir le calendrier")

            med_name = fetch_medicine_name(context.get("medication_id"))
            qty = context.get("medication_qty") or 0
            if qty == 0:
                stock_txt = "<span style='color:red;font-weight:bold;'>épuisé</span>"
            else:
                stock_txt = f"<span style='color:orange;font-weight:bold;'>{qty} restant{'s' if qty != 1 else ''}</span>"

            return (title, f"Le médicament <b>« {med_name} »</b> est {stock_txt}.", "Voir le calendrier")

        case _:
            count = context.get("notification_count")
            if count and count > 1:
                return ("🔔 Nouvelles notifications", f"Vous avez <b>{count}</b> nouvelles notifications dans MediTime.", "Voir les notifications")
            return ("🔔 Nouvelle notification", "Vous avez reçu une nouvelle notification dans MediTime.", "Voir les notifications")


def generate_email_content(notification_type: str, context: NotificationDict) -> Tuple[str, str, str]:
    title, body_html, cta_label = build_notification_text(notification_type, context)
    link = context.get("link") or f"{Config.FRONTEND_URL}/notifications"
    html = f"""
        <p style="font-size:16px;color:#555;white-space:pre-line;">{body_html}</p>
        <div style="margin:32px 0;">
            <a href="{link}" style="background-color:#007bff;color:#fff;text-decoration:none;padding:12px 20px;border-radius:4px;display:inline-block;">
                {cta_label or "Voir mes notifications"}
            </a>
        </div>
        <p style="font-size:13px;color:#999;">
            Si le bouton ne fonctionne pas, copiez-collez ce lien :
            <a href="{link}" style="color:#007bff;">{link}</a>
        </p>
    """
    # Sujet unifié
    return f"MediTime – {title}", body_html, html


# ========= Persistance Web =========
def save_notifications(user_id: str, notification_type: str, items: List[NotificationDict]) -> None:
    """Enregistre chaque notification côté web (historique)."""
    try:
        with get_connection() as conn, conn.cursor() as cur:
            for item in items:
                title, body_html, _ = build_notification_text(notification_type, item)
                content = {**item, "title": title, "body": body_html}
                cur.execute(
                    """
                    INSERT INTO notifications (user_id, type, read, timestamp, sender_uid, content)
                    VALUES (%s, %s, %s, NOW(), %s, %s::jsonb)
                    """,
                    (user_id, notification_type, False, item.get("sender_uid"), json.dumps(content)),
                )
            conn.commit()
    except Exception as e:
        log_backend.error(
            "Erreur save_notifications",
            {"origin": ORIGIN, "code": "SAVE_ERROR", "uid": user_id, "error": str(e), "trace": traceback.format_exc()},
        )


# ========= Envois par canal =========
def _get_fcm_tokens(user_id: str) -> List[str]:
    with get_connection() as conn, conn.cursor() as cur:
        cur.execute("SELECT token FROM fcm_tokens WHERE uid = %s", (user_id,))
        return [r["token"] for r in cur.fetchall()]


def send_push_notification(user_id: str, context: NotificationDict, notification_type: str) -> None:
    title, body_html, _ = build_notification_text(notification_type, context)
    tokens = _get_fcm_tokens(user_id)
    if tokens:
        # Pour push, on passe le body en texte court (sans HTML)
        plain_body = _html_to_plain(body_html)
        send_fcm_notification(tokens, title, plain_body, context)
    else:
        log_backend.warning("Aucun token FCM trouvé", {"origin": ORIGIN, "code": "NO_FCM_TOKEN", "uid": user_id})


def send_email_notification(user: NotificationDict, context: NotificationDict, notification_type: str) -> None:
    email = user.get("email")
    if not email:
        log_backend.warning("Aucun email pour l'utilisateur", {"origin": ORIGIN, "code": "NO_EMAIL", "uid": user.get("id")})
        return
    subject, plain_body, html_content = generate_email_content(notification_type, context)
    send_email(to=email, subject=subject, html_content=html_content, plain=_html_to_plain(plain_body))


def send_sms_notification(user: NotificationDict, context: NotificationDict, notification_type: str) -> None:
    phone = user.get("phone")
    if not phone:
        log_backend.warning("Aucun numéro de téléphone", {"origin": ORIGIN, "code": "NO_PHONE_NUMBER", "uid": user.get("id")})
        return
    # SMS = version texte courte
    title, body_html, _ = build_notification_text(notification_type, context)
    plain = f"{title} — {_html_to_plain(body_html)}"
    send_sms(phone, plain)


def _html_to_plain(html: str) -> str:
    """Ultra simple: enlève les balises basiques pour du texte push/SMS."""
    return (
        html.replace("<b>", "")
        .replace("</b>", "")
        .replace("<p>", "")
        .replace("</p>", " ")
        .replace("<span style='color:red;font-weight:bold;'>", "")
        .replace("<span style='color:orange;font-weight:bold;'>", "")
        .replace("</span>", "")
        .replace("&nbsp;", " ")
        .strip()
    )


# ========= Orchestration =========
def send_grouped_notifications(user_id: str, items: List[NotificationDict], notification_type: str, channels: List[str]) -> None:
    """
    Envoie push/email/SMS une seule fois (groupé) et enregistre côté web si demandé.
    """
    try:
        user = fetch_user(user_id) or {}
        email_enabled = user.get("email_enabled")
        push_enabled = user.get("push_enabled")
        sms_enabled = user.get("sms_enabled")

        # Charge utile groupée
        context = items[0].copy()
        if notification_type == "low_stock":
            context["medications"] = [
                {"name": fetch_medicine_name(n.get("medication_id")), "qty": n.get("medication_qty") or 0} for n in items
            ]
        elif len(items) > 1:
            context["notification_count"] = len(items)

        if "web" in channels:
            save_notifications(user_id, notification_type, items)
        if push_enabled and "push" in channels:
            send_push_notification(user_id, context, notification_type)
        if email_enabled and "email" in channels:
            send_email_notification(user, context, notification_type)
        if sms_enabled and "sms" in channels:
            send_sms_notification(user, context, notification_type)

    except Exception as e:
        log_backend.error(
            "Erreur send_grouped_notifications",
            {"origin": ORIGIN, "code": "SEND_ERROR", "uid": user_id, "error": str(e), "trace": traceback.format_exc()},
        )


def notify_and_record(user_id: str, body_or_list: NotificationDict | List[NotificationDict], notification_type: str, channels: List[str] = list(DEFAULT_CHANNELS)) -> None:
    """Gère 1..n notifications pour un utilisateur + enregistrement Web par défaut."""
    try:
        items = body_or_list if isinstance(body_or_list, list) else [body_or_list]
        enriched_items = [enrich_notification(n) for n in items]
        send_grouped_notifications(user_id, enriched_items, notification_type, list(channels))
    except Exception as e:
        log_backend.error(
            "Erreur notify_and_record",
            {"origin": ORIGIN, "code": "NOTIFICATION_ERROR", "uid": user_id, "error": str(e), "trace": traceback.format_exc()},
        )


# ========= E-mail direct (hors préférences utilisateur) =========
def email_address_direct(to_email: str, notification_type: str, context: NotificationDict) -> None:
    """
    Envoie un e-mail à une adresse arbitraire en réutilisant les templates standard.
    Pas d’enregistrement en base, pas de push/SMS.
    """
    try:
        enriched_context = enrich_notification(context.copy())
        subject, plain_body, html_content = generate_email_content(notification_type, enriched_context)
        send_email(to=to_email, subject=subject, html_content=html_content, plain=_html_to_plain(plain_body))
    except Exception as e:
        log_backend.error(
            "Erreur email_address_direct",
            {
                "origin": ORIGIN,
                "code": "DIRECT_EMAIL_ERROR",
                "to": to_email,
                "notif_type": notification_type,
                "error": str(e),
                "trace": traceback.format_exc(),
            },
        )
