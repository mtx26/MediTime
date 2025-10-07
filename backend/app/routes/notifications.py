from . import api
from app.utils.auth import require_auth
from app.utils.responses import success_response, error_response, warning_response
from app.services.user import fetch_user
from app.services.calendar import fetch_medicine_name
from app.db.connection import get_connection
from flask import request, g
from app.config import Config
from app.utils.measure import measure_time
from app.utils import with_query_origin

frontend_url = Config.FRONTEND_URL or ""


DEFAULT_PHOTO = "https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/icons/person-circle.svg"

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

# Route pour récupérer toutes les notifications (enrichies côté SQL)
@api.route("/notifications", methods=["GET"])
@measure_time()
@require_auth
@with_query_origin(default_origin="REALTIME_NOTIFICATIONS_FETCH")
def handle_notifications():
    uid = g.uid if hasattr(g, "uid") else None
    DEFAULT_PHOTO = "https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/icons/person-circle.svg"

    sql = """
    SELECT
      n.id                                   AS notification_id,
      n.type                                 AS notification_type,
      n.read                                 AS read,
      n.timestamp                            AS timestamp,
      n.calendar_id                          AS calendar_id,

      -- Champs tirés du JSONB "content"
      n.content->>'link'                     AS link,
      n.content->>'medication_qty'           AS medication_qty,

      -- Enrichissements par jointures
      c.name                                 AS calendar_name,
      u.display_name                         AS sender_name,
      u.email                                AS sender_email,
      COALESCE(u.photo_url, %s)              AS sender_photo_url,
      mb.name                                AS medication_name

    FROM notifications n
    LEFT JOIN calendars      c  ON c.id  = n.calendar_id
    LEFT JOIN users          u  ON u.id  = n.sender_uid
    LEFT JOIN medicine_boxes mb ON mb.id = n.medication_id

    WHERE n.user_id = %s

    ORDER BY n.timestamp DESC, n.created_at DESC;
    """

    try:
        with get_connection() as conn, conn.cursor() as cursor:
            cursor.execute(sql, (DEFAULT_PHOTO, uid))
            rows = cursor.fetchall()

        # Pas d'appends: on renvoie les lignes enrichies directement
        return success_response(
            message="notifications récupérées",
            code="NOTIFICATIONS_FETCH_SUCCESS",
            data={"notifications": rows}
        )

    except Exception as e:
        return error_response(
            message="erreur lors de la récupération des notifications",
            code="NOTIFICATIONS_FETCH_ERROR",
            status_code=500,
            error=str(e)
        )

# Route pour marquer une notification comme lue
@api.route("/notifications/<notification_id>", methods=["POST"])
@measure_time()
@require_auth
@with_query_origin(default_origin="NOTIFICATION_READ")
def handle_read_notification(notification_id):
    try:
        uid = g.uid if hasattr(g, "uid") else None

        with get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute("""
                    UPDATE notifications
                    SET read = TRUE
                    WHERE id = %s AND user_id = %s
                    RETURNING id    
                """, (notification_id, uid))
                notif = cursor.fetchone()

                if not notif:
                    return warning_response(
                        message="notification non trouvée", 
                        code="NOTIFICATION_READ_ERROR", 
                        status_code=404, 
                        log_extra={"notification_id": notification_id}
                    )

            conn.commit()

        return success_response(
            message="notification marquée comme lue", 
            code="NOTIFICATION_READ_SUCCESS", 
            log_extra={"notification_id": notification_id}
        )

    except Exception as e:
        return error_response(
            message="erreur lors de la marque de la notification comme lue", 
            code="NOTIFICATION_READ_ERROR", 
            status_code=500,
            error=str(e)
        )


# Route pour enregistrer un token FCM
@api.route("/notifications/register-token", methods=["POST"])
@measure_time()
@require_auth
@with_query_origin(default_origin="FCM_TOKEN")
def register_token():
    data = request.json
    token = data.get("token")
    uid = g.uid if hasattr(g, "uid") else None

    if not token or not uid:
        return error_response(
            message="données manquantes", 
            code="MISSING_DATA",
            status_code=400,
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
            log_extra={"token": token}
        )

    except Exception as e:
        return error_response(
            message="erreur lors de l'enregistrement du token", 
            code="FCM_REGISTER_ERROR",
            status_code=500,
            error=str(e)
        )