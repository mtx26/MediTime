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
from html import escape

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

def _h(text: Any) -> str:
    """Escape sûr pour tout contenu inséré dans le HTML."""
    return escape("" if text is None else str(text))

def _p(html_inner: str) -> str:
    return f"<p style='margin:4px 0'>{html_inner}</p>"

# ========= Construction des contenus =========
def _format_medication_list(medications: List[NotificationDict]) -> str:
    """Liste de médicaments avec emoji et badge de stock."""
    if not medications:
        return ""
    lis = []
    for m in medications:
        name = _h(m.get("name"))
        try:
            qty = float(m.get("qty", 0))
        except Exception:
            qty = 0.0
        if qty <= 0:
            badge = "<span style='color:red;font-weight:bold;'>épuisé</span>"
        else:
            suffix = "s" if int(qty) != 1 else ""
            badge = f"<span style='color:orange;font-weight:bold;'>{int(qty)} restant{suffix}</span>"
        lis.append(f"<li>💊 <b>{name}</b> — {badge}</li>")
    return "<ul style='margin:8px 0; padding-left:20px;'>" + "".join(lis) + "</ul>"

def build_notification_text(notification_type: str, context: NotificationDict) -> Tuple[str, str, str]:
    sender = _h(context.get("sender_name") or "un utilisateur")
    cal = _h(context.get("calendar_name") or "ce calendrier")

    match notification_type:
        case "calendar_invitation":
            title = "📆 Invitation à un calendrier"
            body = _p(f"<b>{sender}</b> vous invite à rejoindre le calendrier « <b>{cal}</b> ».")
            return (title, body, "Accepter l'invitation")

        case "calendar_invitation_registration":
            title = "📆 Invitation à un calendrier"
            body = _p(f"<b>{sender}</b> vous invite à vous inscrire pour accéder au calendrier « <b>{cal}</b> ».")
            return (title, body, "S'inscrire et accepter l'invitation")
        
        case "calendar_invitation_registration_deleted":
            title = "📆 Invitation au calendrier annulée"
            body = _p(f"<b>{sender}</b> a annulé votre invitation à vous inscrire pour accéder au calendrier « <b>{cal}</b> ».")
            return (title, body, "s'inscrire")

        case "calendar_invitation_accepted":
            title = "✅ Invitation acceptée"
            body = _p(f"<b>{sender}</b> a accepté votre invitation pour « <b>{cal}</b> ».")
            return (title, body, "Voir le calendrier")

        case "calendar_invitation_rejected":
            title = "❌ Invitation refusée"
            body = _p(f"<b>{sender}</b> a refusé votre invitation pour « <b>{cal}</b> ».")
            return (title, body, "Voir le calendrier")

        case "calendar_shared_deleted_by_owner":
            title = "🔒 Partage annulé"
            body = _p(f"<b>{sender}</b> a arrêté de partager « <b>{cal}</b> » avec vous.")
            return (title, body, "Ouvrir le site")

        case "calendar_shared_deleted_by_receiver":
            title = "📤 Partage retiré"
            body = _p(f"<b>{sender}</b> a retiré le calendrier « <b>{cal}</b> » de son compte.")
            return (title, body, "Voir le calendrier")

        case "low_stock":
            title = f"⚠️ Stock faible – calendrier « {cal} »"
            if context.get("medications"):
                body = _p(f"Certains médicaments du calendrier <b>« {cal} »</b> sont en stock critique :") \
                       + _format_medication_list(context["medications"])
                return (title, body, "Voir le calendrier")

            med_name = _h(fetch_medicine_name(context.get("medication_id")))
            qty = context.get("medication_qty") or 0
            if qty == 0:
                stock_txt = "<span style='color:red;font-weight:bold;'>épuisé</span>"
            else:
                stock_txt = f"<span style='color:orange;font-weight:bold;'>{qty} restant{'s' if qty != 1 else ''}</span>"
            body = _p(f"Le médicament <b>« {med_name} »</b> est {stock_txt}.")
            return (title, body, "Voir le calendrier")

        case _:
            count = context.get("notification_count")
            if count and count > 1:
                title = "🔔 Nouvelles notifications"
                body = _p(f"Vous avez <b>{count}</b> nouvelles notifications dans MediTime.")
                return (title, body, "Voir les notifications")

            title = "🔔 Nouvelle notification"
            body = _p("Vous avez reçu une nouvelle notification dans MediTime.")
            return (title, body, "Voir les notifications")

def generate_email_content(notification_type: str, context: NotificationDict) -> Tuple[str, str, str]:
    title, body_html, cta_label = build_notification_text(notification_type, context)
    link = f"{Config.FRONTEND_URL}{context.get('link') or f'/notifications'}"
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
                shared_calendar_id = item.get("shared_calendar_id") or None
                print(shared_calendar_id)
                cur.execute(
                    """
                    INSERT INTO notifications (
                        user_id, type, read, timestamp, sender_uid, content, shared_calendar_id
                    )
                    VALUES (%s, %s, %s, NOW(), %s, %s::jsonb, %s)
                    """,
                    (
                        user_id,
                        notification_type,
                        False,
                        item.get("sender_uid"),
                        json.dumps(content),
                        shared_calendar_id
                    ),
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
