from flask import request, g
from . import api
from app.db.connection import get_connection
from app.services.user import fetch_user
from app.services.notifications import get_push_tokens, send_push_notification
from app.utils.responses import success_response, error_response, warning_response
from app.utils.decorators import require_auth, measure_time, with_query_origin
from app.config import Config

frontend_url = Config.FRONTEND_URL or ""


DEFAULT_PHOTO = "https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/icons/person-circle.svg"

def get_calendar_name(calendar_id : str) -> str | None:
    """Récupère le nom d'un calendrier à partir de son ID.
    
    Paramètres:
    - calendar_id (str): ID du calendrier.

    Retour:
    - str | None: Nom du calendrier ou None si non trouvé.
    """
    with get_connection() as conn:
        with conn.cursor() as cursor:
            cursor.execute("SELECT * FROM calendars WHERE id = %s AND deleted_at IS NULL", (calendar_id,))
            calendar = cursor.fetchone()
            if calendar:
                return calendar.get("name")
            else:
                return None
    return None

def get_user_info(uid: str) -> tuple[str | None, str | None, str | None]:
    """Récupère les informations d'un utilisateur à partir de son UID.

    Paramètres:
    - uid (str): UID de l'utilisateur.

    Retour:
    - tuple[str | None, str | None, str | None]: Tuple contenant le nom d'affichage, l'email et l'URL de la photo de l'utilisateur.
    """
    user = fetch_user(uid)
    return user.get("display_name"), user.get("email"), user.get("photo_url")


def clean_notification(cursor):
    """Nettoie les notifications en supprimant les doublons selon des critères spécifiques.
    
    Paramètres:
    - cursor: Curseur de la base de données pour exécuter les requêtes.
    """

    cursor.execute("""
        DELETE FROM notifications
        WHERE medication_id IS NOT NULL
        AND type = 'low_stock'
        AND EXISTS (
            SELECT 1 FROM medicine_boxes mb
            WHERE mb.id = notifications.medication_id
              AND mb.deleted_at IS NULL
              AND mb.stock_quantity > mb.stock_alert_threshold
        )
    """)

    CLEANUP_NOTIFICATIONS_SQL = """
        WITH ranked AS (
            SELECT
                id,
                ROW_NUMBER() OVER (
                    PARTITION BY
                        user_id,

                        CASE
                            WHEN type = 'low_stock'
                                THEN 'low_stock'
                            WHEN type = 'calendar_invitation_accepted'
                                THEN 'calendar_invitation_accepted'
                            WHEN type = 'calendar_shared_deleted_by_receiver'
                                THEN 'calendar_shared_deleted_by_receiver'
                            WHEN type IN ('calendar_invitation', 'calendar_shared_deleted_by_owner')
                                THEN 'calendar_invitation'
                        END,

                        sender_uid,
                        calendar_id,

                        CASE
                            WHEN type = 'low_stock' THEN medication_id
                            ELSE NULL
                        END
                    ORDER BY created_at DESC, id DESC
                ) AS rn
            FROM notifications
            WHERE type IN (
                'low_stock',
                'calendar_invitation_accepted',
                'calendar_shared_deleted_by_receiver',
                'calendar_invitation',
                'calendar_shared_deleted_by_owner'
            )
        )
        DELETE FROM notifications
        WHERE id IN (
            SELECT id
            FROM ranked
            WHERE rn > 1
        );
        """
    
    cursor.execute(CLEANUP_NOTIFICATIONS_SQL)


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

        -- Enrichissements par jointures
        c.name                                 AS calendar_name,
        u.display_name                         AS sender_name,
        u.email                                AS sender_email,
        COALESCE(u.photo_url, %s)              AS sender_photo_url,
        mb.name                                AS medication_name,
        mb.stock_quantity                      AS medication_qty,
        sc.accepted_at IS NOT NULL             AS accepted,
        sc.token                               AS token

    FROM notifications n
    LEFT JOIN calendars c                    ON c.id  = n.calendar_id
    LEFT JOIN users u                        ON u.id  = n.sender_uid
    LEFT JOIN shared_calendars sc            ON sc.id = n.shared_calendar_id
    LEFT JOIN medicine_boxes mb              ON mb.id = n.medication_id

    WHERE n.user_id = %s

    ORDER BY n.timestamp DESC, n.created_at DESC;
    """

    try:
        with get_connection() as conn, conn.cursor() as cursor:
            clean_notification(cursor)
            conn.commit()

            # Récupération des notifications
            cursor.execute(sql, (DEFAULT_PHOTO, uid))
            rows = cursor.fetchall()

        return success_response(
            message="notifications retrieved",
            code="NOTIFICATIONS_FETCH_SUCCESS",
            i18n_key="api.notifications.retrieved",
            data={"notifications": rows}
        )

    except Exception as e:
        return error_response(
            message="error retrieving notifications",
            code="NOTIFICATIONS_FETCH_ERROR",
            i18n_key="api.notifications.fetch_error",
            status_code=500,
            error=str(e)
        )

# Route pour marquer une notification comme lue
@api.route("/notifications/<notification_id>", methods=["PATCH"])
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
                        message="notification not found", 
                        code="NOTIFICATION_NOT_FOUND",
                        i18n_key="api.notifications.not_found", 
                        status_code=404, 
                        log_extra={"notification_id": notification_id}
                    )

            conn.commit()

        return success_response(
            message="notification marked as read", 
            code="NOTIFICATION_READ_SUCCESS",
            i18n_key="api.notifications.marked_read", 
            log_extra={"notification_id": notification_id}
        )

    except Exception as e:
        return error_response(
            message="Error marking notification as read", 
            code="NOTIFICATION_READ_ERROR",
            i18n_key="api.notifications.marked_read_error", 
            status_code=500,
            error=str(e)
        )
        
# Route pour marquer toutes les notifications comme lues
@api.route("/notifications/mark-all-read", methods=["PATCH"])
@measure_time()
@require_auth
@with_query_origin(default_origin="NOTIFICATIONS_MARK_ALL_READ")
def mark_all_notifications_read():
    try:
        uid = g.uid if hasattr(g, "uid") else None

        with get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute("""
                    UPDATE notifications
                    SET read = TRUE
                    WHERE user_id = %s AND read = FALSE
                    RETURNING id    
                """, (uid,))
                notifs = cursor.fetchall()

                if not notifs:
                    return warning_response(
                        message="no unread notifications found", 
                        code="NO_UNREAD_NOTIFICATIONS",
                        i18n_key="api.notifications.no_unread_notifications", 
                        status_code=404
                    )

            conn.commit()

        return success_response(
            message="all notifications marked as read", 
            code="ALL_NOTIFICATIONS_MARKED_READ",
            i18n_key="api.notifications.all_marked_read"
        )

    except Exception as e:
        return error_response(
            message="error marking all notifications as read", 
            code="NOTIFICATIONS_MARK_ALL_READ_ERROR",
            i18n_key="api.notifications.mark_all_read_error", 
            status_code=500,
            error=str(e)
        )


# Route pour enregistrer un token push (Expo ou FCM)
@api.route("/notifications/push-token", methods=["POST"])
@api.route("/notifications/fcm-token", methods=["POST"])
@measure_time()
@require_auth
@with_query_origin(default_origin="PUSH_TOKEN_SEND")
def register_token():
    data = request.json
    token = data.get("token")
    device_name = data.get("deviceName")
    platform = data.get("platform")
    provider = data.get("provider")
    project_id = data.get("projectId")
    uid = g.uid

    inferred_provider = provider
    if inferred_provider not in {"expo", "fcm"}:
        inferred_provider = "expo" if isinstance(token, str) and token.startswith(("ExpoPushToken[", "ExponentPushToken[")) else "fcm"

    normalized_platform = platform if platform in {"ios", "android", "web"} else None

    if not token or not uid:
        return error_response(
            message="missing data", 
            code="MISSING_DATA",
            i18n_key="api.notifications.missing_data",
            status_code=400,
        )

    try:
        with get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute("""
                    INSERT INTO push_tokens (uid, token, device_name, provider, platform, project_id)
                    VALUES (%s, %s, %s, %s, %s, %s)
                    ON CONFLICT (token) DO UPDATE
                    SET uid = EXCLUDED.uid,
                        device_name = COALESCE(EXCLUDED.device_name, push_tokens.device_name),
                        provider = EXCLUDED.provider,
                        platform = COALESCE(EXCLUDED.platform, push_tokens.platform),
                        project_id = COALESCE(EXCLUDED.project_id, push_tokens.project_id),
                        updated_at = now();
                """, (uid, token, device_name, inferred_provider, normalized_platform, project_id))
                conn.commit()

        return success_response(
            message="push token registered", 
            code="PUSH_TOKEN_REGISTERED",
            i18n_key="api.notifications.token_saved",
            log_extra={"token": token}
        )

    except Exception as e:
        return error_response(
            message="error during push token registration", 
            code="PUSH_TOKEN_REGISTER_ERROR",
            i18n_key="api.notifications.token_save_error",
            status_code=500,
            error=str(e)
        )


@api.route("/notifications/test-push", methods=["POST"])
@measure_time()
@require_auth
@with_query_origin(default_origin="TEST_PUSH_SEND")
def send_test_push_notification():
    uid = g.uid if hasattr(g, "uid") else None

    if not uid:
        return error_response(
            message="missing user",
            code="MISSING_USER",
            status_code=401,
        )

    try:
        tokens = get_push_tokens(uid)
        if not tokens:
            return warning_response(
                message="no push token found",
                code="NO_PUSH_TOKEN",
                status_code=404,
            )

        send_push_notification(
            {"id": uid},
            {
                "sender_name": "MediTime",
                "notification_count": 1,
                "link": "/notifications",
            },
            "test_push",
        )

        return success_response(
            message="test push sent",
            code="TEST_PUSH_SENT",
            data={"tokens_count": len(tokens)},
        )
    except Exception as e:
        return error_response(
            message="error sending test push",
            code="TEST_PUSH_SEND_ERROR",
            status_code=500,
            error=str(e),
        )