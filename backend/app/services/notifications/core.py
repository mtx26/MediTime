
# ===============================
# Service de notifications MediTime
# ===============================
# Gère la création, l'envoi et l'enregistrement des notifications (web, email, push, SMS)
# Fournit des helpers pour enrichir les notifications, générer les contenus, et orchestrer l'envoi selon les canaux.
#
# Dépendances : FCM, email, SMS, base de données, configuration frontend
#
# Auteur : mtx26 / MediTime
# ===============================

import json
import traceback
from typing import List, Tuple, Dict, Any

from app.auth.fcm import send_fcm_notification  # Envoi de notifications push via Firebase
from app.db.connection import get_connection    # Connexion à la base de données
from app.services.calendar import fetch_calendar, fetch_medicine_name  # Récupération calendrier/médicament
from app.services.notifications.messaging import send_email, send_sms  # Envoi email/SMS
from app.services.user import fetch_user       # Récupération utilisateur
from app.utils.logging import log_backend      # Logger backend
from app.config import Config                  # Configuration globale
from html import escape                        # Sécurisation HTML


# ========= Constantes =========
ORIGIN = "NOTIFICATIONS"  # Origine pour le logging
DEFAULT_CHANNELS: Tuple[str, ...] = ("email", "web")  # Canaux par défaut (web = historique, email)
DEFAULT_USER_NAME = "un utilisateur"  # Nom par défaut si utilisateur inconnu
VIEW_CALENDAR_LABEL = "Voir le calendrier"  # Libellé CTA générique


# ========= Types =========
NotificationDict = Dict[str, Any]  # Alias pour la structure d'une notification



# ========= Helpers de données =========
def fetch_user_name(user_id: str | None) -> str:
    """
    Récupère le nom d'affichage d'un utilisateur à partir de son ID.
    Retourne un nom par défaut si l'utilisateur n'existe pas ou si l'ID est None.
    """
    if not user_id:
        return DEFAULT_USER_NAME
    user = fetch_user(user_id)
    return user.get("display_name") if user else DEFAULT_USER_NAME


def fetch_calendar_name(calendar_id: str | None) -> str | None:
    """
    Récupère le nom d'un calendrier à partir de son ID.
    Retourne None si l'ID est absent, ou "unknown" si le calendrier n'existe pas.
    """
    if not calendar_id:
        return None
    calendar = fetch_calendar(calendar_id)
    return calendar.get("name") if calendar else "unknown"


def enrich_notification(notification: NotificationDict) -> NotificationDict:
    """
    Ajoute les noms du calendrier et de l’expéditeur au dictionnaire de notification.
    Permet d'avoir des contenus plus riches pour l'affichage et l'envoi.
    """
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
    """
    Sécurise une chaîne pour l'insertion dans du HTML (anti XSS).
    Utilisé pour tous les contenus dynamiques dans les emails/notifications.
    """
    return escape("" if text is None else str(text))

def _p(html_inner: str) -> str:
    """
    Enveloppe un contenu HTML dans une balise <p> stylisée.
    """
    return f"<p style='margin:4px 0'>{html_inner}</p>"


# ========= Construction des contenus =========
def _format_medication_list(medications: List[NotificationDict]) -> str:
    """
    Génère une liste HTML de médicaments avec emoji et badge de stock (pour emails/notifications).
    Affiche "épuisé" si le stock est à 0, sinon le nombre restant.
    """
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
    """
    Génère le titre, le corps HTML et le libellé du bouton d'action pour une notification donnée.
    Utilisé pour tous les canaux (web, email, push, SMS).
    """
    sender = _h(context.get("sender_name") or DEFAULT_USER_NAME)
    cal = _h(context.get("calendar_name") or "ce calendrier")

    match notification_type:
        case "calendar_invitation":
            # Invitation à rejoindre un calendrier partagé
            title = "📆 Invitation à un calendrier"
            body = _p(f"<b>{sender}</b> vous invite à rejoindre le calendrier « <b>{cal}</b> ».")
            return (title, body, "Accepter l'invitation")

        case "calendar_invitation_registration":
            # Invitation à s'inscrire pour accéder à un calendrier
            title = "📆 Invitation à un calendrier"
            body = _p(f"<b>{sender}</b> vous invite à vous inscrire pour accéder au calendrier « <b>{cal}</b> ».")
            return (title, body, "S'inscrire et accepter l'invitation")
        
        case "calendar_invitation_registration_deleted":
            # Annulation d'une invitation à s'inscrire
            title = "📆 Invitation au calendrier annulée"
            body = _p(f"<b>{sender}</b> a annulé votre invitation à vous inscrire pour accéder au calendrier « <b>{cal}</b> ».")
            return (title, body, "s'inscrire")

        case "calendar_invitation_accepted":
            # Confirmation d'acceptation d'une invitation
            title = "✅ Invitation acceptée"
            body = _p(f"<b>{sender}</b> a accepté votre invitation pour « <b>{cal}</b> ».")
            return (title, body, VIEW_CALENDAR_LABEL)

        case "calendar_invitation_rejected":
            # Refus d'une invitation
            title = "❌ Invitation refusée"
            body = _p(f"<b>{sender}</b> a refusé votre invitation pour « <b>{cal}</b> ».")
            return (title, body, VIEW_CALENDAR_LABEL)

        case "calendar_shared_deleted_by_owner":
            # Le propriétaire a arrêté le partage
            title = "🔒 Partage annulé"
            body = _p(f"<b>{sender}</b> a arrêté de partager « <b>{cal}</b> » avec vous.")
            return (title, body, "Ouvrir le site")

        case "calendar_shared_deleted_by_receiver":
            # Le destinataire a retiré le calendrier de son compte
            title = "📤 Partage retiré"
            body = _p(f"<b>{sender}</b> a retiré le calendrier « <b>{cal}</b> » de son compte.")
            return (title, body, VIEW_CALENDAR_LABEL)

        case "low_stock":
            # Stock faible ou épuisé pour un ou plusieurs médicaments
            title = f"⚠️ Stock faible – calendrier « {cal} »"
            if context.get("medications"):
                body = _p(f"Certains médicaments du calendrier <b>« {cal} »</b> sont en stock critique :") \
                       + _format_medication_list(context["medications"])
                return (title, body, VIEW_CALENDAR_LABEL)

            med_name = _h(fetch_medicine_name(context.get("medication_id")))
            qty = context.get("medication_qty") or 0
            if qty == 0:
                stock_txt = "<span style='color:red;font-weight:bold;'>épuisé</span>"
            else:
                stock_txt = f"<span style='color:orange;font-weight:bold;'>{qty} restant{'s' if qty != 1 else ''}</span>"
            body = _p(f"Le médicament <b>« {med_name} »</b> est {stock_txt}.")
            return (title, body, VIEW_CALENDAR_LABEL)

        case _:
            # Cas générique : notification simple ou groupée
            count = context.get("notification_count")
            if count and count > 1:
                title = "🔔 Nouvelles notifications"
                body = _p(f"Vous avez <b>{count}</b> nouvelles notifications dans MediTime.")
                return (title, body, "Voir les notifications")

            title = "🔔 Nouvelle notification"
            body = _p("Vous avez reçu une nouvelle notification dans MediTime.")
            return (title, body, "Voir les notifications")


def generate_email_content(notification_type: str, context: NotificationDict) -> Tuple[str, str, str]:
    """
    Génère le sujet, le corps texte et le HTML complet pour un email de notification.
    Utilise les templates standards MediTime.
    """
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
    """
    Enregistre chaque notification dans la base de données (historique web).
    Utilisé pour l'affichage dans l'interface utilisateur (onglet notifications).
    verif pour chaque mod si il y'a la nécessité de nettoyer les anciennes notif pour chaque type (low_stock, calendar_invitation_accepted, calendar_shared_deleted_by_owner, calendar_invitation)
    """
    try:
        with get_connection() as conn, conn.cursor() as cur:
            for item in items:
                title, body_html, _ = build_notification_text(notification_type, item)
                content = {**item, "title": title, "body": body_html}
                shared_calendar_id = item.get("shared_calendar_id") or None
                calendar_id = item.get("calendar_id") or None
                sender_uid = item.get("sender_uid") or None
                medication_id = item.get("medication_id") or None
                
                # Nettoyage simple: supprimer la plus ancienne notif correspondante selon le type
                if notification_type == "low_stock" and sender_uid and calendar_id and medication_id:
                    cur.execute(
                        """
                        DELETE FROM notifications
                        WHERE user_id = %s
                          AND type = %s
                          AND sender_uid = %s
                          AND calendar_id = %s
                          AND medication_id = %s
                        """,
                        (user_id, notification_type, sender_uid, calendar_id, medication_id),
                    )
                elif (notification_type == "calendar_invitation_accepted" or notification_type == "calendar_shared_deleted_by_owner") and sender_uid and calendar_id:
                    cur.execute(
                        """
                        DELETE FROM notifications
                        WHERE user_id = %s
                          AND type = %s
                          AND sender_uid = %s
                          AND calendar_id = %s
                        """,
                        (user_id, notification_type, sender_uid, calendar_id),
                    )
                elif notification_type == "calendar_invitation" and sender_uid and shared_calendar_id and calendar_id:
                    cur.execute(
                        """
                        DELETE FROM notifications
                        WHERE user_id = %s
                          AND type = %s
                          AND sender_uid = %s
                          AND shared_calendar_id = %s
                          AND calendar_id = %s
                        """,
                        (user_id, notification_type, sender_uid, shared_calendar_id, calendar_id),
                    )
                cur.execute(
                    """
                    INSERT INTO notifications (
                        user_id, type, read, timestamp, sender_uid, calendar_id, content, medication_id, shared_calendar_id
                    )
                    VALUES (%s, %s, %s, NOW(), %s, %s, %s::jsonb, %s, %s)
                    """,
                    (
                        user_id,
                        notification_type,
                        False,
                        sender_uid,
                        calendar_id,
                        json.dumps(content),
                        medication_id,
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
    """
    Récupère la liste des tokens FCM pour un utilisateur (pour notifications push).
    """
    with get_connection() as conn, conn.cursor() as cur:
        cur.execute("SELECT token FROM fcm_tokens WHERE uid = %s", (user_id,))
        return [r["token"] for r in cur.fetchall()]


def send_push_notification(user_id: str, context: NotificationDict, notification_type: str) -> None:
    """
    Envoie une notification push via FCM à l'utilisateur (si tokens disponibles).
    Le corps est converti en texte brut pour compatibilité mobile.
    """
    title, body_html, _ = build_notification_text(notification_type, context)
    tokens = _get_fcm_tokens(user_id)
    if tokens:
        # Pour push, on passe le body en texte court (sans HTML)
        plain_body = _html_to_plain(body_html)
        send_fcm_notification(tokens, title, plain_body, context)
    else:
        log_backend.warning("Aucun token FCM trouvé", {"origin": ORIGIN, "code": "NO_FCM_TOKEN", "uid": user_id})


def send_email_notification(user: NotificationDict, context: NotificationDict, notification_type: str) -> None:
    """
    Envoie un email à l'utilisateur (si email renseigné).
    Utilise le template standard MediTime.
    """
    email = user.get("email")
    if not email:
        log_backend.warning("Aucun email pour l'utilisateur", {"origin": ORIGIN, "code": "NO_EMAIL", "uid": user.get("id")})
        return
    subject, plain_body, html_content = generate_email_content(notification_type, context)
    send_email(to=email, subject=subject, html_content=html_content, plain=_html_to_plain(plain_body))


def send_sms_notification(user: NotificationDict, context: NotificationDict, notification_type: str) -> None:
    """
    Envoie un SMS à l'utilisateur (si numéro renseigné).
    Utilise une version texte courte de la notification.
    """
    phone = user.get("phone")
    if not phone:
        log_backend.warning("Aucun numéro de téléphone", {"origin": ORIGIN, "code": "NO_PHONE_NUMBER", "uid": user.get("id")})
        return
    # SMS = version texte courte
    title, body_html, _ = build_notification_text(notification_type, context)
    plain = f"{title} — {_html_to_plain(body_html)}"
    send_sms(phone, plain)


def _html_to_plain(html: str) -> str:
    """
    Conversion ultra simple du HTML vers du texte brut (pour push/SMS).
    Retire les balises <b>, <p>, <span> et remplace les entités de base.
    """
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
    Orchestration principale :
    - Envoie push/email/SMS une seule fois (groupé) selon les préférences utilisateur et les canaux demandés
    - Enregistre côté web si demandé
    - Agrège les notifications similaires (ex : stock faible sur plusieurs médicaments)
    """
    try:
        user = fetch_user(user_id) or {}
        email_enabled = user.get("email_enabled")
        push_enabled = user.get("push_enabled")
        sms_enabled = user.get("sms_enabled")

        # Construction du contexte groupé
        context = items[0].copy()
        if notification_type == "low_stock":
            # Pour le stock faible, on regroupe tous les médicaments concernés
            context["medications"] = [
                {"name": fetch_medicine_name(n.get("medication_id")), "qty": n.get("medication_qty") or 0} for n in items
            ]
        elif len(items) > 1:
            # Pour d'autres cas, on indique le nombre de notifications groupées
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
    """
    Point d'entrée principal :
    - Gère 1 ou plusieurs notifications pour un utilisateur
    - Enrichit les notifications (ajout noms, etc.)
    - Orchestration de l'envoi et de l'enregistrement web
    """
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
    Envoie un e-mail à une adresse arbitraire (ex : support, test, etc.) en réutilisant les templates standard.
    Ne tient pas compte des préférences utilisateur, pas d’enregistrement en base, pas de push/SMS.
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
