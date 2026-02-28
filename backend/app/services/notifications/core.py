
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
from psycopg2 import sql

from app.services.notifications.messaging import send_fcm_notification  # Envoi de notifications push via Firebase
from app.db.connection import get_connection    # Connexion à la base de données
from app.services.calendar import fetch_calendar, fetch_medicine_name  # Récupération calendrier/médicament
from app.services.notifications.messaging import send_email, send_sms  # Envoi email/SMS
from app.services.user import fetch_user, fetch_public_user_info       # Récupération utilisateur
from app.utils.logging import log_backend      # Logger backend
from app.config import Config                  # Configuration globale
from html import escape                        # Sécurisation HTML


# ========= Constantes =========
ORIGIN = "NOTIFICATIONS"  # Origine pour le logging
DEFAULT_CHANNELS: List[str] = ["email", "web", "push"]  # Canaux par défaut (web = historique, email, )
DEFAULT_USER_NAME = "un utilisateur"  # Nom par défaut si utilisateur inconnu
VIEW_CALENDAR_LABEL = "Voir le calendrier"  # Libellé CTA générique


# ========= Helpers de données =========
def fetch_user_name(user_id: str) -> str:
    """
    Récupère le nom d'affichage d'un utilisateur à partir de son ID.

    Paramètres:
    - user_id (str): ID de l'utilisateur.
    """
    if not user_id:
        return DEFAULT_USER_NAME
    # Utilisation de fetch_public_user_info pour contourner le RLS si nécessaire
    # car l'utilisateur qui reçoit la notif n'est pas forcément celui qui l'a envoyée
    user = fetch_public_user_info(user_id)
    return user.get("display_name") if user else DEFAULT_USER_NAME


def fetch_calendar_name(calendar_id: str) -> str | None:
    """
    Récupère le nom d'un calendrier à partir de son ID.

    Paramètres:
    - calendar_id (str): ID du calendrier.

    Retour:
    - str | None: Nom du calendrier ou "unknown" si non trouvé.
    """
    if not calendar_id:
        return None
    calendar = fetch_calendar(calendar_id)
    return calendar.get("name") if calendar else "unknown"


def enrich_notification(notification: Dict) -> Dict:
    """
    Ajoute les noms du calendrier et de l’expéditeur au dictionnaire de notification.
    Permet d'avoir des contenus plus riches pour l'affichage et l'envoi.

    Paramètres:
    - notification (Dict): Dictionnaire de notification à enrichir.

    Retour:
    - Dict: Dictionnaire enrichi avec les noms.
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

    Paramètres:
    - text (Any): Texte à sécuriser.

    Retour:
    - str: Texte sécurisé pour HTML.
    """
    return escape("" if text is None else str(text))

def _p(html_inner: str) -> str:
    """
    Enveloppe un contenu HTML dans une balise <p> stylisée.

    Paramètres:
    - html_inner (str): Contenu HTML à envelopper.

    Retour:
    - str: Contenu enveloppé dans une balise <p> avec style.
    """
    return f"<p style='margin:4px 0'>{html_inner}</p>"


NOTIFICATION_TEMPLATES = {
    "calendar_invitation": {
        "title": "📆 Invitation à un calendrier",
        "body": "{sender} vous invite à rejoindre le calendrier « {cal} ».",
        "cta": "Accepter l'invitation"
    },
    "calendar_invitation_registration": {
        "title": "📆 Invitation à un calendrier",
        "body": "{sender} vous invite à vous inscrire pour accéder au calendrier « {cal} ».",
        "cta": "S'inscrire et accepter l'invitation"
    },
    "calendar_invitation_registration_deleted": {
        "title": "📆 Invitation au calendrier annulée",
        "body": "{sender} a annulé votre invitation à vous inscrire pour accéder au calendrier « {cal} ».",
        "cta": "S'inscrire"
    },
    "calendar_invitation_accepted": {
        "title": "✅ Invitation acceptée",
        "body": "{sender} a accepté votre invitation pour « {cal} ».",
        "cta": VIEW_CALENDAR_LABEL
    },
    "calendar_invitation_rejected": {
        "title": "❌ Invitation refusée",
        "body": "{sender} a refusé votre invitation pour « {cal} ».",
        "cta": VIEW_CALENDAR_LABEL
    },
    "calendar_shared_deleted_by_owner": {
        "title": "🔒 Partage annulé",
        "body": "{sender} a arrêté de partager « {cal} » avec vous.",
        "cta": "Ouvrir le site"
    },
    "calendar_shared_deleted_by_receiver": {
        "title": "📤 Partage retiré",
        "body": "{sender} a retiré le calendrier « {cal} » de son compte.",
        "cta": VIEW_CALENDAR_LABEL
    }
}

# ========= Construction des contenus =========
def format_medication_list(medications: List[Dict]) -> str:
    """
    Génère une liste HTML de médicaments avec emoji et badge de stock (pour emails/notifications).

    Paramètres:
    - medications (List[Dict]): Liste de dictionnaires représentant les médicaments.
    Retour:
    - str: Liste HTML formatée des médicaments.
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


def build_low_stock_text(context: Dict, cal: str) -> Tuple[str, str, str]:
    """
    Génère le titre, le corps HTML et le libellé du bouton d'action pour une notification de stock faible.

    Paramètres:
    - context (Dict): Contexte contenant les données nécessaires pour construire le message.
    - cal (str): Nom du calendrier.

    Retour:
    - Tuple[str, str, str, str]: Titre, corps HTML, corps FCM et libellé du bouton d'action.
    """
    meds = context.get("medications") or []
    
    title = f"⚠️ Stock faible – calendrier « {cal} »"

    # ---- Cas : plusieurs médicaments en stock critique ----
    if len(meds) > 1:
        body = (
            _p(f"Certains médicaments du calendrier <b>« {cal} »</b> sont en stock critique :")
            + format_medication_list(meds)
        )
        fcm_body = f"Certains médicaments du calendrier « {cal} » sont en stock critique."
        return (title, body, fcm_body, VIEW_CALENDAR_LABEL)

    # ---- Cas : un seul médicament ----
    if len(meds) == 1:
        med = meds[0]
        med_name = _h(med.get("name"))
        qty = med.get("qty") or 0

        if qty == 0:
            stock_txt = "<span style='color:red;font-weight:bold;'>est à court de stock</span>"
            stock_txt_fcm = "est à court de stock"
        else:
            stock_txt = (
                f"<span style='color:orange;font-weight:bold;'>a seulement {qty} dose"
                f"{'s' if qty != 1 else ''} restante"
                f"{'s' if qty != 1 else ''}</span>"
            )
            stock_txt_fcm = f"a seulement {qty} dose{'s' if qty != 1 else ''} restante{'s' if qty != 1 else ''}"

        body = _p(f"Le médicament <b>« {med_name} »</b> {stock_txt}.")
        fcm_body = f"Le médicament « {med_name} » {stock_txt_fcm}."

        return (title, body, fcm_body, VIEW_CALENDAR_LABEL)
    
    log_backend.warning(
        "Aucun médicament pour notification de stock faible (cas inattendu)",
        {"origin": ORIGIN, "code": "NO_MEDICATION_IN_CONTEXT_UNEXPECTED", "context": context},
    )
    return (title, "", "", VIEW_CALENDAR_LABEL)



def build_generic_text(context: Dict) -> Tuple[str, str, str]:
    """
    Génère le titre, le corps HTML et le libellé du bouton d'action pour une notification générique.

    Paramètres:
    - context (Dict): Contexte contenant les données nécessaires pour construire le message.

    Retour:
    - Tuple[str, str, str, str]: Titre, corps HTML, corps FCM et libellé du bouton d'action.
    """

    count = context.get("notification_count")
    if count and count > 1:
        title = "🔔 Nouvelles notifications"
        body = _p(f"Vous avez <b>{count}</b> nouvelles notifications dans MediTime.")
        fcm_body = f"Vous avez {count} nouvelles notifications dans MediTime."
        return (title, body, fcm_body, "Voir les notifications")

    title = "🔔 Nouvelle notification"
    body = _p("Vous avez reçu une nouvelle notification dans MediTime.")
    fcm_body = "Vous avez reçu une nouvelle notification dans MediTime."
    return (title, body, fcm_body, "Voir les notifications")

def build_notification_text(notification_type: str, context: Dict) -> Tuple[str, str, str]:
    """
    Génère le titre, le corps HTML et le libellé du bouton d'action pour une notification donnée.
    Utilisé pour tous les canaux (web, email, push, SMS).

    Paramètres:
    - notification_type (str): Type de notification.
    - context (Dict): Contexte contenant les données nécessaires pour construire le message.

    Retour:
    - Tuple[str, str, str]: Titre, corps HTML et libellé du bouton d'action.
    """
    sender = _h(context.get("sender_name") or DEFAULT_USER_NAME)
    cal = _h(context.get("calendar_name") or "ce calendrier")

    if notification_type in NOTIFICATION_TEMPLATES:
        tmpl = NOTIFICATION_TEMPLATES[notification_type]
        body = _p(tmpl["body"].format(sender=f"<b>{sender}</b>", cal=f"<b>{cal}</b>"))
        fcm_body = tmpl["body"].format(sender=sender, cal=cal)
        return (tmpl["title"], body, fcm_body, tmpl["cta"])

    if notification_type == "low_stock":
        return build_low_stock_text(context, cal)

    return build_generic_text(context)


def generate_email_content(notification_type: str, context: Dict) -> Tuple[str, str, str]:
    """
    Génère le sujet, le corps texte et le HTML complet pour un email de notification.
    
    Paramètres:
    - notification_type (str): Type de notification.
    - context (Dict): Contexte contenant les données nécessaires pour construire le message.

    Retour:
    - Tuple[str, str, str]: Sujet de l'email, corps texte et corps HTML.
    """
    title, body_html, fcm_body, cta_label = build_notification_text(notification_type, context)
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
    return f"MediTime – {title}", fcm_body,  html

def save_notifications(user_id: str, notification_type: str, items: List[Dict]):
    """
    Enregistre chaque notification dans la base de données (historique web).
    Utilisé pour l'affichage dans l'interface utilisateur (onglet notifications).

    Paramètres:
    - user_id (str): Identifiant de l'utilisateur.
    - notification_type (str): Type de notification.
    - items (List[Dict]): Liste des données des notifications à enregistrer.
    """
    try:
        with get_connection(skip_rls=True) as conn, conn.cursor() as cur:
            for item in items:  
                cur.execute(
                    """
                    INSERT INTO notifications (
                        user_id, type, read, timestamp, sender_uid, calendar_id, medication_id, shared_calendar_id
                    )
                    VALUES (%s, %s, %s, NOW(), %s, %s, %s, %s)
                    """,
                    (
                        user_id,
                        notification_type,
                        False,
                        item.get("sender_uid"),
                        item.get("calendar_id"),
                        item.get("medication_id"),
                        item.get("shared_calendar_id")
                    ),
                )
            conn.commit()

        log_backend.info(
            "Notifications enregistrées",
            {"origin": "WEB", "code": "SAVE_SUCCESS", "uid": user_id, "count": len(items)},
        )
    except Exception as e:
        log_backend.error(
            "Erreur save_notifications",
            {"origin": "WEB", "code": "SAVE_ERROR", "uid": user_id, "error": str(e), "trace": traceback.format_exc()},
        )



# ========= Envois par canal =========
def get_fcm_tokens(user_id: str) -> List[str]:
    """
    Récupère la liste des tokens FCM pour un utilisateur (pour notifications push).

    Paramètres:
    - user_id (str): Identifiant de l'utilisateur.

    Retour:
    - List[str]: Liste des tokens FCM.
    """
    with get_connection() as conn, conn.cursor() as cur:
        cur.execute("SELECT token FROM get_fcm_tokens_for_user(%s)", (user_id,))
        return [r["token"] for r in cur.fetchall()]


def send_push_notification(user: Dict, context: Dict, notification_type: str):
    """
    Envoie une notification push via FCM à l'utilisateur (si tokens disponibles).
    Le corps est converti en texte brut pour compatibilité mobile.

    Paramètres:
    - user (Dict): Dictionnaire utilisateur contenant au moins l'ID.
    - context (Dict): Contexte de la notification.
    - notification_type (str): Type de notification.
    """
    title, _, fcm_body, _ = build_notification_text(notification_type, context)
    tokens = get_fcm_tokens(user.get("id"))
    if tokens:
        send_fcm_notification(tokens, title, fcm_body, context)
    else:
        log_backend.warning("Aucun token FCM trouvé", {"origin": "FCM", "code": "NO_FCM_TOKEN", "uid": user.get("id")})


def send_email_notification(user: Dict, context: Dict, notification_type: str):
    """
    Envoie un email à l'utilisateur (si email renseigné).
    Utilise le template standard MediTime.

    Paramètres:
    - user (Dict): Dictionnaire utilisateur contenant au moins l'email.
    - context (Dict): Contexte de la notification.
    - notification_type (str): Type de notification.
    """
    email = user.get("email")
    if not email:
        log_backend.warning("Aucun email pour l'utilisateur", {"origin": ORIGIN, "code": "NO_EMAIL", "uid": user.get("id")})
        return
    subject, fcm_body, html_content = generate_email_content(notification_type, context)
    send_email(to=email, subject=subject, html_content=html_content, plain=fcm_body)


def send_sms_notification(user: Dict, context: Dict, notification_type: str):
    """
    Envoie un SMS à l'utilisateur (si numéro renseigné).
    Utilise une version texte courte de la notification.

    Paramètres:
    - user (Dict): Dictionnaire utilisateur contenant au moins le numéro de téléphone.
    - context (Dict): Contexte de la notification.
    - notification_type (str): Type de notification.
    """
    phone = user.get("phone")
    if not phone:
        log_backend.warning("Aucun numéro de téléphone", {"origin": "SMS", "code": "NO_PHONE_NUMBER", "uid": user.get("id")})
        return
    # SMS = version texte courte
    title, _, fcm_body, _ = build_notification_text(notification_type, context)
    message = f"{title} — {fcm_body}"
    send_sms(phone, message)

# ========= Orchestration =========
def prepare_grouped_context(items: List[Dict], notification_type: str) -> Dict:
    """
    Prépare le contexte pour les notifications groupées.
    
    Paramètres:
    - items (List[Dict]): Liste des notifications à grouper.
    - notification_type (str): Type de notification.

    Retour:
    - Dict: Contexte enrichi pour la notification groupée.
    """
    context = items[0].copy()
    if notification_type == "low_stock":
        # Pour le stock faible, on regroupe tous les médicaments concernés
        context["medications"] = [
            {"name": fetch_medicine_name(n.get("medication_id")), "qty": n.get("medication_qty") or 0} for n in items
        ]
    elif len(items) > 1:
        # Pour d'autres cas, on indique le nombre de notifications groupées
        context["notification_count"] = len(items)
    return context

def send_grouped_notifications(user_id: str, items: List[Dict], notification_type: str, channels: List[str]):
    """
    Envoie un groupe de notifications à un utilisateur via les canaux spécifiés.

    Paramètres:
    - user_id (str): Identifiant de l'utilisateur.
    - items (List[Dict]): Liste des notifications à envoyer.
    - notification_type (str): Type de notification.
    - channels (List[str]): Canaux par lesquels envoyer les notifications.
    """
    try:
        user = fetch_user(user_id) or {}
        context = prepare_grouped_context(items, notification_type)

        if "web" in channels:
            save_notifications(user_id, notification_type, items)
        
        # Mapping des canaux vers les fonctions d'envoi et les clés de préférence utilisateur
        channel_actions = [
            ("push", "push_enabled", send_push_notification),
            ("email", "email_enabled", send_email_notification),
            ("sms", "sms_enabled", send_sms_notification)
        ]

        for channel, pref_key, send_func in channel_actions:
            if channel in channels and user.get(pref_key):
                send_func(user, context, notification_type)

    except Exception as e:
        log_backend.error(
            "Erreur send_grouped_notifications",
            {"origin": ORIGIN, "code": "SEND_ERROR", "uid": user_id, "error": str(e), "trace": traceback.format_exc()},
        )


def notify_and_record(user_id: str, body_or_list: Dict | List[Dict], notification_type: str, channels: List[str] | None = None):
    """
    Envoie une ou plusieurs notifications à un utilisateur via les canaux spécifiés et les enregistre dans l'historique web.

    Paramètres:
    - user_id (str): Identifiant de l'utilisateur.
    - body_or_list (Dict | List[Dict]): Notification ou liste de notifications à envoyer.
    - notification_type (str): Type de notification.
    - channels (List[str] | None): Canaux par lesquels envoyer les notifications. Par défaut DEFAULT_CHANNELS.
    """
    if channels is None:
        channels = DEFAULT_CHANNELS.copy()
    try:
        items = body_or_list if isinstance(body_or_list, list) else [body_or_list]
        enriched_items = [enrich_notification(n) for n in items]
        send_grouped_notifications(user_id, enriched_items, notification_type, channels)
    except Exception as e:
        log_backend.error(
            "Erreur notify_and_record",
            {"origin": ORIGIN, "code": "NOTIFICATION_ERROR", "uid": user_id, "error": str(e), "trace": traceback.format_exc()},
        )



# ========= E-mail direct (hors préférences utilisateur) =========
def email_address_direct(to_email: str, notification_type: str, context: Dict):
    """
    Envoie un e-mail à une adresse arbitraire (ex : support, test, etc.) en réutilisant les templates standard.
    Ne tient pas compte des préférences utilisateur, pas d’enregistrement en base, pas de push/SMS.

    Paramètres:
    - to_email (str): Adresse e-mail du destinataire.
    - notification_type (str): Type de notification.
    - context (Dict): Contexte de la notification.
    """
    try:
        enriched_context = enrich_notification(context.copy())
        subject, fcm_body, html_content = generate_email_content(notification_type, enriched_context)
        send_email(to=to_email, subject=subject, html_content=html_content, plain=fcm_body)
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
