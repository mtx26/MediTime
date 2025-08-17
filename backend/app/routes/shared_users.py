from app.utils.auth import require_auth
from datetime import datetime, timezone
from . import api
from app.services.calendar import verify_calendar_share, generate_calendar_schedule
from flask import request, g
from app.utils.responses import success_response, error_response, warning_response
from app.db.connection import get_connection
from app.services.notifications import notify_and_record
from app.config import Config
from urllib.parse import urljoin
from app.services.medication import check_if_stock_is_low
from app.utils.measure import measure_time
from app.utils import with_query_origin


ERROR_CALENDAR_NOT_FOUND = "calendrier non trouvé"
ERROR_UNAUTHORIZED_ACCESS = "accès refusé"
SUCCESS_SHARED_CALENDARS_LOAD = "calendriers partagés récupérés"

SELECT_SHARED_CALENDAR = "SELECT * FROM calendars WHERE id = %s"

# Route pour récupérer les calendriers partagés
@api.route("/shared/users/calendars", methods=["GET"])
@measure_time()
@require_auth
@with_query_origin(default_origin="REALTIME_SHARED_CALENDARS_FETCH")
def handle_shared_calendars():
    try:
        uid = g.uid if hasattr(g, "uid") else None

        with get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute("""
                    SELECT
                        sc.calendar_id AS id,
                        sc.access,
                        c.name AS name,
                        c.owner_uid,
                        u.display_name AS owner_name,
                        u.email AS owner_email,
                        COALESCE(u.photo_url, 'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/icons/person-circle.svg') AS owner_photo_url,
                        COUNT(mb.id) AS "boxesCount",
                        COALESCE(BOOL_OR(mb.stock_quantity <= mb.stock_alert_threshold), FALSE) AS "ifLowStock"
                    FROM shared_calendars sc
                    JOIN calendars c            ON sc.calendar_id = c.id
                    JOIN users u                ON c.owner_uid = u.id
                    LEFT JOIN medicine_boxes mb ON mb.calendar_id = c.id
                    WHERE sc.receiver_uid = %s
                      AND sc.accepted = TRUE
                    GROUP BY
                        sc.calendar_id, sc.access, c.id, c.name, c.owner_uid,
                        u.display_name, u.email, u.photo_url
                """, (uid,))
                rows = cursor.fetchall()

        if not rows:
            return success_response(
                message=SUCCESS_SHARED_CALENDARS_LOAD,
                code="SHARED_CALENDARS_LOAD_EMPTY",
                data={"calendars": []}
            )

        calendars_list = [
            dict(row)
            for row in rows
            if verify_calendar_share(row["id"], uid)
        ]

        return success_response(
            message=SUCCESS_SHARED_CALENDARS_LOAD,
            code="SHARED_CALENDARS_LOAD_SUCCESS",
            data={"calendars": calendars_list}
        )

    except Exception as e:
        return error_response(
            message="erreur lors de la récupération des calendriers partagés",
            code="SHARED_CALENDARS_ERROR",
            status_code=500,
            error=str(e)
        )


@api.route("/shared/users/calendars/<calendar_id>/schedule", methods=["GET"])
@measure_time()
@require_auth
@verify_calendar_share
@with_query_origin(default_origin="SHARED_CALENDAR_FETCH_SCHEDULE")
def handle_user_shared_calendar_schedule(calendar_id):
    try:

        start_date = request.args.get("startDate")

        if not start_date:
            start_date = datetime.now(timezone.utc).date()
        else:
            start_date = datetime.strptime(start_date, "%Y-%m-%d").date()

        schedule, table, calendar_name = generate_calendar_schedule(calendar_id, start_date)

        if_low_stock = check_if_stock_is_low(calendar_id)

        return success_response(
            message=SUCCESS_SHARED_CALENDARS_LOAD, 
            code="SHARED_CALENDARS_LOAD_SUCCESS", 
            data={"schedule": schedule, "table": table, "calendar_name": calendar_name, "if_low_stock": if_low_stock},
            log_extra={"calendar_id": calendar_id}
        )

    except Exception as e:
        return error_response(
            message="erreur lors de la récupération du calendrier partagé",
            code="SHARED_CALENDARS_ERROR", 
            status_code=500,
            error=str(e),
            log_extra={"calendar_id": calendar_id}
        )


# Route pour supprimer un calendrier partagé pour le receiver
@api.route("/shared/users/calendars/<calendar_id>", methods=["DELETE"])
@measure_time()
@require_auth
@verify_calendar_share
@with_query_origin(default_origin="SHARED_CALENDAR_DELETE")
def handle_delete_user_shared_calendar(calendar_id):
    try:
        receiver_uid = g.uid if hasattr(g, "uid") else None

        with get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute("""
                    DELETE FROM shared_calendars sc
                    USING calendars c
                    WHERE sc.calendar_id = c.id
                      AND sc.receiver_uid = %s
                      AND sc.calendar_id = %s
                    RETURNING c.owner_uid
                """, (receiver_uid, calendar_id))
                result = cursor.fetchone()

                if not result:
                    return warning_response(
                        message=ERROR_CALENDAR_NOT_FOUND,
                        code="SHARED_CALENDAR_DELETE_ERROR",
                        status_code=404,
                        log_extra={"calendar_id": calendar_id}
                    )

                owner_uid = result.get("owner_uid")
                link = urljoin(Config.FRONTEND_URL or "", "/calendars")

                notify_and_record(
                    user_id=owner_uid,
                    body_or_list={
                        "link": link,
                        "calendar_id": calendar_id,
                        "sender_uid": receiver_uid
                    },
                    notification_type="calendar_shared_deleted_by_receiver",
                )

        return success_response(
            message="calendrier partagé supprimé",
            code="SHARED_CALENDAR_DELETE_SUCCESS",
            log_extra={"calendar_id": calendar_id}
        )

    except Exception as e:
        return error_response(
            message="erreur lors de la suppression du calendrier partagé",
            code="SHARED_CALENDARS_DELETE_ERROR",
            status_code=500,
            error=str(e),
            log_extra={"calendar_id": calendar_id}
        )


@api.route("/shared/grouped", methods=["GET"])
@measure_time()
@require_auth
@with_query_origin(default_origin="SHARED_FETCH")
def handle_grouped_shared():
    uid = g.uid if hasattr(g, "uid") else None

    sql = """
    SELECT
      c.id   AS calendar_id,
      c.name AS calendar_name,

      -- USERS (shared_calendars x users)
      COALESCE(
        (
          SELECT jsonb_agg(
                   jsonb_build_object(
                     'receiver_uid', sc.receiver_uid,
                     'access', sc.access,
                     'accepted', sc.accepted,
                     'token', sc.token,
                     'receiver_photo_url', COALESCE(u.photo_url, 'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/icons/person-circle.svg'),
                     'receiver_name', u.display_name,
                     'receiver_email', u.email
                   )
                   ORDER BY u.display_name NULLS LAST
                 )
          FROM shared_calendars sc
          JOIN users u ON u.id = sc.receiver_uid
          WHERE sc.calendar_id = c.id
        ),
        '[]'::jsonb
      ) AS users,

        -- TOKENS
        COALESCE(
        (
            SELECT jsonb_agg(to_jsonb(st) ORDER BY st.created_at)
            FROM shared_tokens st
            WHERE st.calendar_id = c.id
        ),
        '[]'::jsonb
        ) AS tokens,

      -- INVITATIONS
      COALESCE(
        (
          SELECT jsonb_agg( (to_jsonb(i) - 'id') ORDER BY i.created_at )
          FROM invitations i
          WHERE i.calendar_id = c.id
        ),
        '[]'::jsonb
      ) AS invitations

    FROM calendars c
    WHERE c.owner_uid = %s
    ORDER BY c.name;
    """

    try:
        with get_connection() as conn, conn.cursor() as cursor:
            cursor.execute(sql, (uid,))
            rows = cursor.fetchall()

        grouped = {
            row["calendar_id"]: {
                "calendar_name": row["calendar_name"],
                "users": row["users"],            # jsonb list
                "tokens": row["tokens"],          # jsonb list
                "invitation": row["invitations"], # garde ta clé existante
            }
            for row in rows
        }

        return success_response(
            message="Données partagées groupées récupérées",
            code="SHARED_GROUPED_LOAD_SUCCESS",
            data={"grouped": grouped},
            log_extra={"calendar_count": len(grouped)}
        )

    except Exception as e:
        return error_response(
            message="Erreur lors du chargement des données partagées groupées",
            code="SHARED_GROUPED_LOAD_ERROR",
            error=str(e)
        )



@api.route("/shared/users/calendars/<calendar_id>/notifications", methods=["GET"])
@measure_time()
@require_auth
@verify_calendar_share
@with_query_origin(default_origin="SHARED_USER_NOTIFICATIONS_ENABLED_FETCH")
def handle_shared_user_notifications(calendar_id):
    try:
        
        with get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute("SELECT notifications_enabled FROM shared_calendars WHERE calendar_id = %s", (calendar_id,))
                calendar = cursor.fetchone()
                if not calendar:
                    return warning_response(
                        message="calendrier partagé non trouvé",
                        code="SHARED_CALENDARS_NOTIFICATIONS_ERROR",
                        status_code=404,
                        log_extra={"calendar_id": calendar_id}
                    )
                notifications_enabled = calendar.get("notifications_enabled", False)

        return success_response(
            message="notifications récupérées",
            code="SHARED_CALENDARS_NOTIFICATIONS_SUCCESS",
            data={"notifications-enabled": notifications_enabled},
            log_extra={"calendar_id": calendar_id}
        )
    except Exception as e:
        return error_response(
            message="erreur lors de la récupération des notifications",
            code="SHARED_CALENDARS_NOTIFICATIONS_ERROR",
            status_code=500,
            error=str(e),
            log_extra={"calendar_id": calendar_id}
        )

@api.route("/shared/users/calendars/<calendar_id>/notifications", methods=["PUT"])
@measure_time()
@require_auth
@verify_calendar_share
@with_query_origin(default_origin="SHARED_USER_NOTIFICATIONS_ENABLED_UPDATE")
def handle_shared_user_notifications_update(calendar_id):
    try:

        payload = request.get_json(force=True)
        notifications_enabled = payload.get("notifications-enabled")

        if not notifications_enabled:
            return warning_response(
                message="Données manquantes",
                code="SHARED_CALENDARS_NOTIFICATIONS_ERROR",
                status_code=400,
                log_extra={"calendar_id": calendar_id}
            )
        with get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute("UPDATE shared_calendars SET notifications_enabled = %s WHERE calendar_id = %s", (notifications_enabled, calendar_id))

        return success_response(
            message="Notifications mises à jour",
            code="SHARED_CALENDARS_NOTIFICATIONS_SUCCESS",
            log_extra={"calendar_id": calendar_id}
        )
    except Exception as e:
        return error_response(
            message="Erreur lors de la mise à jour des notifications",
            code="SHARED_CALENDARS_NOTIFICATIONS_ERROR",
            status_code=500,
            error=str(e),
            log_extra={"calendar_id": calendar_id}
        )
