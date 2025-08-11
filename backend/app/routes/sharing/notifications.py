from .. import api
from app.utils.auth import require_auth
from app.utils.responses import success_response, error_response, warning_response
from app.services.user import fetch_user
from app.services.calendar import fetch_medicine_name, verify_calendar_share
from app.db.connection import get_connection
from flask import request, g
import time
from app.config import Config
from psycopg2 import sql

frontend_url = Config.FRONTEND_URL or ""

DEFAULT_PHOTO = "https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/icons/person-circle.svg"

ERROR_UNAUTHORIZED_ACCESS = "accès refusé"

def get_calendar_name(calendar_id):
    with get_connection() as conn:
        with conn.cursor() as cursor:
            cursor.execute("SELECT * FROM calendars WHERE id = %s", (calendar_id,))
            calendar = cursor.fetchone()
            if calendar:
                return calendar.get("name")
            else:
                return None
    return None

def get_user_info(uid):
    user = fetch_user(uid)
    return user.get("display_name"), user.get("email"), user.get("photo_url")

# Route pour récupérer toutes les notifications
@api.route("/notifications", methods=["GET"])
@require_auth
def handle_notifications():
    try:
        t_0 = time.time()
        uid = g.uid
        with get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute("SELECT * FROM notifications WHERE user_id = %s", (uid,))
                notifications_data = cursor.fetchall()

                if notifications_data is None:
                    return success_response(
                        message="aucune notification trouvée",
                        code="NOTIFICATIONS_FETCH_SUCCESS",
                        uid=uid,
                        origin="NOTIFICATIONS_FETCH",
                        data={"notifications": []}
                    )

                calendar_name_cache = {}
                sender_info_cache = {}
                medication_name_cache = {}
                notifications = []
                t_1 = time.time()

                for notif in notifications_data:
                    json_body = notif.get("content") or {}
                    sender_uid = notif.get("sender_uid")
                    calendar_id = json_body.get("calendar_id")
                    link = json_body.get("link") if json_body.get("link") else None
                    medication_id = json_body.get("medication_id") if json_body.get("medication_id") else None
                    medication_qty = json_body.get("medication_qty") if json_body.get("medication_qty") else None

                    if not calendar_id:
                        continue

                    if medication_id:
                        if medication_id not in medication_name_cache:
                            medication_name_cache[medication_id] = fetch_medicine_name(medication_id)
                        medication_name = medication_name_cache[medication_id]
                    else:
                        medication_name = None

                    # Cache calendar name
                    if calendar_id not in calendar_name_cache:
                        calendar_name_cache[calendar_id] = get_calendar_name(calendar_id)
                    calendar_name = calendar_name_cache[calendar_id]

                    # Cache sender info
                    if sender_uid not in sender_info_cache:
                        sender_info_cache[sender_uid] = get_user_info(sender_uid)
                    sender_name, sender_email, sender_photo_url = sender_info_cache[sender_uid]

                    notifications.append({
                        "notification_id": notif.get("id"),
                        "notification_type": notif.get("type"),
                        "read": notif.get("read"),
                        "timestamp": notif.get("timestamp"),
                        "calendar_id": calendar_id,
                        "calendar_name": calendar_name,
                        "sender_name": sender_name,
                        "sender_email": sender_email,
                        "sender_photo_url": sender_photo_url or DEFAULT_PHOTO,
                        "link" : link,
                        "medication_name": medication_name,
                        "medication_qty": medication_qty,
                    })
                t_2 = time.time()

        return success_response(
            message="notifications récupérées",
            code="NOTIFICATIONS_FETCH_SUCCESS",
            uid=uid,
            origin="NOTIFICATIONS_FETCH",
            data={"notifications": notifications},
            log_extra={"time": t_2 - t_0, "time_append": t_2 - t_1}
        )

    except Exception as e:
        return error_response(
            message="erreur lors de la récupération des notifications",
            code="NOTIFICATIONS_FETCH_ERROR",
            status_code=500,
            uid=uid,
            origin="NOTIFICATIONS_FETCH",
            error=str(e)
        )

# Route pour marquer une notification comme lue
@api.route("/notifications/<notification_id>", methods=["POST"])
@require_auth
def handle_read_notification(notification_id):
    try:
        t_0 = time.time()
        uid = g.uid

        with get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute("SELECT * FROM notifications WHERE id = %s AND user_id = %s", (notification_id, uid))
                notif = cursor.fetchone()
                if not notif:
                    return warning_response(
                        message="notification non trouvée", 
                        code="NOTIFICATION_READ_ERROR", 
                        status_code=404, 
                        uid=uid, 
                        origin="NOTIFICATION_READ",
                        log_extra={"notification_id": notification_id}
                    )

                cursor.execute("UPDATE notifications SET read = TRUE WHERE id = %s AND user_id = %s", (notification_id, uid))
                conn.commit()
                t_1 = time.time()

        return success_response(
            message="notification marquée comme lue", 
            code="NOTIFICATION_READ_SUCCESS", 
            uid=uid, 
            origin="NOTIFICATION_READ",
            log_extra={"notification_id": notification_id, "time": t_1 - t_0}
        )

    except Exception as e:
        return error_response(
            message="erreur lors de la marque de la notification comme lue", 
            code="NOTIFICATION_READ_ERROR", 
            status_code=500, 
            uid=uid, 
            origin="NOTIFICATION_READ",
            error=str(e)
        )

# Route pour enregistrer un token FCM
@api.route("/notifications/register-token", methods=["POST"])
@require_auth
def register_token():
    data = request.json
    token = data.get("token")
    uid = g.uid

    if not token or not uid:
        return error_response(
            message="données manquantes", 
            code="MISSING_DATA",
            status_code=400,
            origin="FCM_REGISTER"
        )

    try:
        with get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute("""
                    INSERT INTO fcm_tokens (uid, token)
                    VALUES (%s, %s)
                    ON CONFLICT (token) DO NOTHING;
                """, (uid, token))
                conn.commit()

        return success_response(
            message="token enregistré", 
            code="FCM_REGISTERED",
            uid=uid,
            origin="FCM_REGISTER",
            log_extra={"token": token}
        )

    except Exception as e:
        return error_response(
            message="erreur lors de l'enregistrement du token",
            code="FCM_REGISTER_ERROR",
            status_code=500,
            origin="FCM_REGISTER",
            error=str(e)
        )


# Route pour récupérer les notifications d'un calendrier partagé
@api.route("/shared/users/calendars/<calendar_id>/notifications", methods=["GET"])
@require_auth
def handle_shared_user_notifications(calendar_id):
    try:
        t_0 = time.time()
        uid = g.uid
        if not verify_calendar_share(calendar_id, uid):
            return warning_response(
                message=ERROR_UNAUTHORIZED_ACCESS,
                code="SHARED_CALENDARS_NOTIFICATIONS_ERROR",
                status_code=403,
                uid=uid,
                origin="SHARED_CALENDARS_NOTIFICATIONS",
                log_extra={"calendar_id": calendar_id}
            )
        with get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute(
                    "SELECT notifications_enabled FROM shared_calendars WHERE calendar_id = %s",
                    (calendar_id,),
                )
                calendar = cursor.fetchone()
                if not calendar:
                    return warning_response(
                        message="calendrier partagé non trouvé",
                        code="SHARED_CALENDARS_NOTIFICATIONS_ERROR",
                        status_code=404,
                        uid=uid,
                        origin="SHARED_CALENDARS_NOTIFICATIONS",
                        log_extra={"calendar_id": calendar_id}
                    )
                notifications_enabled = calendar.get("notifications_enabled", False)
        t_1 = time.time()
        return success_response(
            message="notifications récupérées",
            code="SHARED_CALENDARS_NOTIFICATIONS_SUCCESS",
            uid=uid,
            origin="SHARED_CALENDARS_NOTIFICATIONS",
            data={"notifications-enabled": notifications_enabled},
            log_extra={"calendar_id": calendar_id, "time": t_1 - t_0},
        )
    except Exception as e:
        return error_response(
            message="erreur lors de la récupération des notifications",
            code="SHARED_CALENDARS_NOTIFICATIONS_ERROR",
            status_code=500,
            uid=uid,
            origin="SHARED_CALENDARS_NOTIFICATIONS",
            error=str(e),
            log_extra={"calendar_id": calendar_id},
        )


# Route pour mettre à jour les notifications d'un calendrier partagé
@api.route("/shared/users/calendars/<calendar_id>/notifications", methods=["PUT"])
@require_auth
def handle_shared_user_notifications_update(calendar_id):
    try:
        t_0 = time.time()
        uid = g.uid
        if not verify_calendar_share(calendar_id, uid):
            return warning_response(
                message=ERROR_UNAUTHORIZED_ACCESS,
                code="SHARED_CALENDARS_NOTIFICATIONS_ERROR",
                status_code=403,
                uid=uid,
                origin="SHARED_CALENDARS_NOTIFICATIONS",
                log_extra={"calendar_id": calendar_id}
            )
        data = request.get_json()
        if not data or "notifications-enabled" not in data:
            return warning_response(
                message="Données manquantes",
                code="SHARED_CALENDARS_NOTIFICATIONS_ERROR",
                status_code=400,
                uid=uid,
                origin="SHARED_CALENDARS_NOTIFICATIONS",
                log_extra={"calendar_id": calendar_id}
            )
        notifications_enabled = data["notifications-enabled"]
        with get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute(
                    sql.SQL(
                        "UPDATE shared_calendars SET notifications_enabled = %s WHERE calendar_id = %s"
                    ),
                    (notifications_enabled, calendar_id),
                )
        t_1 = time.time()
        return success_response(
            message="Notifications mises à jour",
            code="SHARED_CALENDARS_NOTIFICATIONS_SUCCESS",
            uid=uid,
            origin="SHARED_CALENDARS_NOTIFICATIONS",
            log_extra={"calendar_id": calendar_id, "time": t_1 - t_0},
        )
    except Exception as e:
        return error_response(
            message="Erreur lors de la mise à jour des notifications",
            code="SHARED_CALENDARS_NOTIFICATIONS_ERROR",
            status_code=500,
            uid=uid,
            origin="SHARED_CALENDARS_NOTIFICATIONS",
            error=str(e),
            log_extra={"calendar_id": calendar_id},
        )


__all__ = [
    "register_token",
    "handle_shared_user_notifications",
    "handle_shared_user_notifications_update",
]
