from flask import request, g, Response
from . import api
from datetime import datetime, timezone
from app.db.connection import get_connection
from app.services.calendar import generate_calendar_schedule, update_stock_decrement_method
from app.services.documents import generate_medicine_conditions_pdf
from app.services.medication import check_if_stock_is_low
from app.utils.responses import success_response, error_response, warning_response
from app.utils.decorators import require_auth, verify_calendar, measure_time, with_query_origin, elapsed_now
from app.utils.logging import log_backend

ERROR_CALENDAR_NOT_FOUND = "calendrier non trouvé"

# Route pour récupérer les calendriers de l'utilisateur
@api.route("/calendars", methods=["GET"])
@measure_time()
@require_auth
@with_query_origin(default_origin="REALTIME_CALENDAR_FETCH")
def handle_calendars():
    try:
        uid = g.uid if hasattr(g, "uid") else None
        with get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute("""
                    SELECT 
                        c.*, 
                        cs.stock_decrement_method,
                        COUNT(mb.id) AS boxes_count,
                        COALESCE(BOOL_OR(mb.stock_quantity <= mb.stock_alert_threshold AND mb.stock_alert_threshold > 0 AND mb.box_capacity > 0), FALSE) AS "ifLowStock"
                    FROM calendars c
                    LEFT JOIN calendar_settings cs ON cs.calendar_id = c.id
                    LEFT JOIN medicine_boxes mb 
                        ON mb.calendar_id = c.id
                        AND mb.deleted_at IS NULL
                    WHERE c.owner_uid = %s and c.deleted_at IS NULL
                    GROUP BY c.id, cs.stock_decrement_method
                """, (uid,))
                calendars = cursor.fetchall()

                if not calendars:
                    return success_response(
                        message="retrieved calendars",
                        code="CALENDAR_FETCH_SUCCESS",
                        i18n_key="api.calendar.retrieved",
                        data={"calendars": []},
                    )

        return success_response(
            message="retrieved calendars",
            code="CALENDAR_FETCH_SUCCESS",
            i18n_key="api.calendar.retrieved",
            data={"calendars": calendars},
        )
    except Exception as e:
        return error_response(
            message="Error retrieving calendars", 
            code="CALENDAR_FETCH_ERROR",
            i18n_key="api.calendar.fetch_error", 
            status_code=500, 
            error=str(e)
        )


# Route pour créer un calendrier
@api.route("/calendars", methods=["POST"])
@measure_time()
@require_auth
@with_query_origin(default_origin="CALENDAR_CREATE")
def handle_create_calendar():
    try:
        uid = g.uid if hasattr(g, "uid") else None
        payload = request.get_json(force=True)
        calendar_name = payload.get("calendarName")

        if not calendar_name:
            return warning_response(
                message="calendar name missing", 
                code="CALENDAR_CREATE_ERROR",
                i18n_key="api.calendar.creation_error", 
                status_code=400, 
                log_extra={"calendar_name": calendar_name}
            )

        with get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute("INSERT INTO calendars (owner_uid, name) VALUES (%s, %s) RETURNING id", (uid, calendar_name))
                calendar_id = cursor.fetchone().get("id")
                conn.commit()

        return success_response(
            message="calendar created", 
            code="CALENDAR_CREATE",
            i18n_key="api.calendar.created", 
            data={"calendarId": calendar_id, "calendarName": calendar_name},
            log_extra={"calendar_name": calendar_name}
        )

    except Exception as e:
        return error_response(
            message="error while creating the calendar", 
            code="CALENDAR_CREATE_ERROR",
            i18n_key="api.calendar.creation_error", 
            status_code=500, 
            error=str(e)
        )


# Route pour supprimer un calendrier
@api.route("/calendars/<calendar_id>", methods=["DELETE"])
@measure_time()
@require_auth
@verify_calendar
@with_query_origin(default_origin="CALENDAR_DELETE")
def handle_delete_calendar(calendar_id):
    try:

        if not calendar_id:
            return warning_response(
                message="invalid calendar ID",
                code="CALENDAR_DELETE_ERROR",
                i18n_key="api.calendar.delete_error",
                status_code=400,
                log_extra={"calendar_id": calendar_id}
            )

        with get_connection() as conn:
            with conn.cursor() as cursor:
                # Supprime et vérifie en une seule requête
                cursor.execute("""
                    UPDATE calendars
                    SET deleted_at = NOW()
                    WHERE id = %s AND deleted_at IS NULL
                    RETURNING 1
                """, (calendar_id,))
                deleted = cursor.fetchone()

            conn.commit()

        if not deleted:
            return warning_response(
                message=ERROR_CALENDAR_NOT_FOUND,
                code="CALENDAR_DELETE_ERROR",
                status_code=404,
                log_extra={"calendar_id": calendar_id}
            )

        return success_response(
            message="calendar deleted",
            code="CALENDAR_DELETE_SUCCESS",
            i18n_key="api.calendar.deleted",
            log_extra={"calendar_id": calendar_id}
        )

    except Exception as e:
        return error_response(
            message="Error deleting calendar",
            code="CALENDAR_DELETE_ERROR",
            i18n_key="api.calendar.delete_error",
            status_code=500,
            error=str(e)
        )


# Route pour renommer un calendrier
@api.route("/calendars/<calendar_id>", methods=["PUT"])
@measure_time()
@require_auth
@verify_calendar
@with_query_origin(default_origin="CALENDAR_RENAME")
def handle_rename_calendar(calendar_id):
    try:
        payload = request.get_json(force=True)
        new_calendar_name = payload.get("newCalendarName")

        if not new_calendar_name:
            return warning_response(
                message="calendar name missing",
                code="CALENDAR_RENAME_ERROR",
                i18n_key="api.calendar.rename_error",
                status_code=400,
                log_extra={"calendar_id": calendar_id, "new_calendar_name": new_calendar_name}
            )

        with get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute(
                    """
                    WITH old AS (
                      SELECT id, name FROM calendars WHERE id = %s
                    ),
                    flags AS (
                      SELECT
                        EXISTS (SELECT 1 FROM old) AS exists,
                        EXISTS (SELECT 1 FROM old WHERE name IS NOT DISTINCT FROM %s) AS same
                    ),
                    upd AS (
                      UPDATE calendars c
                      SET name = %s
                      FROM old
                      WHERE c.id = old.id AND old.name IS DISTINCT FROM %s
                      RETURNING old.name AS old_name, c.name AS new_name, c.id AS calendar_id
                    )
                    SELECT
                      (SELECT exists FROM flags) AS exists,
                      (SELECT same FROM flags) AS same,
                      (SELECT old_name FROM upd) AS old_name,
                      (SELECT new_name FROM upd) AS new_name,
                      (SELECT calendar_id FROM upd) AS calendar_id;
                    """,
                    (calendar_id, new_calendar_name, new_calendar_name, new_calendar_name)
                )
                row = cursor.fetchone()

            conn.commit()

        # Cas: calendrier inexistant
        if not row or not row.get("exists"):
            return warning_response(
                message=ERROR_CALENDAR_NOT_FOUND,
                code="CALENDAR_RENAME_ERROR",
                status_code=404,
                log_extra={"calendar_id": calendar_id, "new_calendar_name": new_calendar_name},
                i18n_key="api.calendar.rename_error"
            )

        # Cas: même nom qu'avant
        if row.get("same"):
            return warning_response(
                message="the calendar name is already the same",
                code="CALENDAR_RENAME_ERROR",
                i18n_key="api.calendar.rename_error",
                status_code=400,
                log_extra={
                    "calendar_id": calendar_id,
                    "old_calendar_name": row.get("old_name"),
                    "new_calendar_name": new_calendar_name
                }
            )

        # Succès
        return success_response(
            message="renowned calendar",
            code="CALENDAR_RENAME_SUCCESS",
            i18n_key="api.calendar.renamed",
            log_extra={
                "calendar_id": row.get("calendar_id") or calendar_id,
                "old_calendar_name": row.get("old_name"),
                "new_calendar_name": row.get("new_name") or new_calendar_name
            }
        )

    except Exception as e:
        return error_response(
            message="error renaming calendar",
            code="CALENDAR_RENAME_ERROR",
            i18n_key="api.calendar.rename_error",
            status_code=500,
            error=str(e)
        )
  

# Route pour générer le calendrier 
@api.route("/calendars/<calendar_id>/schedule", methods=["GET"])
@measure_time()
@require_auth
@verify_calendar
@with_query_origin(default_origin="CALENDAR_FETCH_SCHEDULE")
def handle_calendar_schedule(calendar_id):
    try:
        start_date = request.args.get("startDate")

        if not start_date:
            start_date = datetime.now(timezone.utc).date()
        else:
            start_date = datetime.strptime(start_date, "%Y-%m-%d").date()

        schedule, table, calendar_name = generate_calendar_schedule(calendar_id, start_date)

        if_low_stock = check_if_stock_is_low(calendar_id)

        return success_response(
            message="calendar generated", 
            code="CALENDAR_GENERATE_SUCCESS",
            i18n_key="api.calendar.calendar_generated",
            data={"schedule": schedule, "table": table, "calendar_name": calendar_name, "if_low_stock": if_low_stock},
            log_extra={"calendar_id": calendar_id}
        )

    except Exception as e:
        return error_response(
            message="error during calendar generation", 
            code="CALENDAR_GENERATE_ERROR",
            i18n_key="api.calendar.generation_error", 
            status_code=500, 
            error=str(e),
            log_extra={"calendar_id": calendar_id}
        )

@api.route("/calendars/<calendar_id>/pdf", methods=["GET"])
@measure_time()
@with_query_origin(default_origin="PDF_DOWNLOAD")
def download_pdf_calendar(calendar_id):
    try:
        # TODO: Sécuriser cette route

        if not calendar_id:
            return error_response(
                message="missing calendar_id",
                code="MISSING_CALENDAR_ID",
                i18n_key="api.calendar.missing_id",
                status_code=400,
            )

        # Génère le PDF en mémoire
        pdf_buffer = generate_medicine_conditions_pdf(calendar_id)

        # Log facultatif
        log_backend.info("PDF généré avec succès", {
            "origin": g.origin,
            "code": "PDF_DOWNLOAD_SUCCESS",
            "time": elapsed_now()
        })

        return Response(
            pdf_buffer.getvalue(),
            mimetype="application/pdf",
            headers={
                "Content-Disposition": f"inline; filename=calendrier_{calendar_id[:8]}.pdf",
                "Content-Type": "application/pdf"
            }
        )
    except Exception as e:
        return error_response(
            message="Error downloading PDF",
            code="PDF_DOWNLOAD_ERROR_CALENDAR",
            i18n_key="api.calendar.pdf_download_error",
            status_code=500,
            error=str(e)
        )

@api.route("/calendars/<calendar_id>/stock-decrement-method", methods=["GET"])
@measure_time()
@require_auth
@verify_calendar
@with_query_origin(default_origin="PERSONNAL_STOCK_DECREMENT_METHOD_FETCH")
def get_personnal_stock_decrement_method(calendar_id):
    try:
        with get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute("SELECT stock_decrement_method FROM calendar_settings WHERE calendar_id = %s", (calendar_id,))
                result = cursor.fetchone()
                if result is None:
                    return warning_response(
                        message=ERROR_CALENDAR_NOT_FOUND,
                        code="PERSONNAL_STOCK_DECREMENT_METHOD_FETCH_ERROR",
                        status_code=404,
                        log_extra={"calendar_id": calendar_id},
                        i18n_key="api.calendar.stock_method_fetch_error"
                    )
                method = result.get("stock_decrement_method")

        return success_response(
            message="inventory reduction method recovered",
            code="PERSONNAL_STOCK_DECREMENT_METHOD_FETCH_SUCCESS",
            i18n_key="api.calendar.stock_method_retrieved",
            data={"method": method},
            log_extra={"calendar_id": calendar_id, "method": method}
        )
    except Exception as e:
        return error_response(
            message="error during retrieval of the stock reduction method",
            code="PERSONNAL_STOCK_DECREMENT_METHOD_FETCH_ERROR",
            i18n_key="api.calendar.stock_method_fetch_error",
            status_code=500,
            error=str(e),
            log_extra={"calendar_id": calendar_id}
        )

    
@api.route("/calendars/<calendar_id>/stock-decrement-method", methods=["POST"])
@measure_time()
@require_auth
@verify_calendar
@with_query_origin(default_origin="PERSONNAL_STOCK_DECREMENT_METHOD_UPDATE")
def update_personnal_stock_decrement_method(calendar_id):
    try:

        payload = request.get_json(force=True)
        method = payload.get("method")

        if not method:
            return warning_response(
                message="missing method",
                code="PERSONNAL_STOCK_DECREMENT_METHOD_UPDATE_ERROR",
                i18n_key="api.calendar.stock_method_update_error",
                status_code=400,
                log_extra={"calendar_id": calendar_id}
            )

        update_stock_decrement_method(calendar_id, method)

        return success_response(
            message="updated inventory reduction method", 
            code="PERSONNAL_STOCK_DECREMENT_METHOD_UPDATE_SUCCESS",
            i18n_key="api.calendar.stock_method_updated",
            log_extra={"calendar_id": calendar_id, "method": method}
        )
    except Exception as e:
        return error_response(
            message="Error during the update of the stock reduction method", 
            code="PERSONNAL_STOCK_DECREMENT_METHOD_UPDATE_ERROR",
            i18n_key="api.calendar.stock_method_update_error", 
            status_code=500, 
            error=str(e),
            log_extra={"calendar_id": calendar_id}
        )

@api.route("/calendars/<calendar_id>/notifications", methods=["GET"])
@measure_time()
@require_auth
@verify_calendar
@with_query_origin(default_origin="PERSONAL_NOTIFICATIONS_ENABLED_FETCH")
def fetch_personal_notifications_enabled(calendar_id):
    try:
        with get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute("""
                    SELECT notifications_enabled 
                    FROM calendar_settings 
                    WHERE calendar_id = %s
                """, (calendar_id,))
                result = cursor.fetchone()
                if result is None:
                    return warning_response(
                        message=ERROR_CALENDAR_NOT_FOUND,
                        code="PERSONAL_NOTIFICATIONS_ENABLED_FETCH_ERROR",
                        status_code=404,
                        log_extra={"calendar_id": calendar_id},
                        i18n_key="api.calendar.notifications_fetch_error"
                    )
                enabled = result.get("notifications_enabled", False)

        return success_response(
            message="notification settings retrieved",
            code="PERSONAL_NOTIFICATIONS_ENABLED_FETCH_SUCCESS",
            i18n_key="api.calendar.notifications_retrieved",
            data={"notifications-enabled": enabled},
            log_extra={"calendar_id": calendar_id}
        )
    except Exception as e:
        return error_response(
            message="Error retrieving notification settings",
            code="PERSONAL_NOTIFICATIONS_ENABLED_FETCH_ERROR",
            i18n_key="api.calendar.notifications_fetch_error",
            status_code=500,
            error=str(e),
            log_extra={"calendar_id": calendar_id}
        )
    
@api.route("/calendars/<calendar_id>/notifications", methods=["PUT"])
@measure_time()
@require_auth
@verify_calendar
@with_query_origin(default_origin="PERSONAL_NOTIFICATIONS_ENABLED_UPDATE")
def update_personal_notifications_enabled(calendar_id):
    try:
        with get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute("""
                    UPDATE calendar_settings
                    SET notifications_enabled = NOT notifications_enabled
                    WHERE calendar_id = %s
                """, (calendar_id,))
                conn.commit()

        return success_response(
            message="notification settings updated", 
            code="PERSONAL_NOTIFICATIONS_ENABLED_UPDATE_SUCCESS",
            i18n_key="api.calendar.notifications_updated",
            log_extra={"calendar_id": calendar_id}
        )
    except Exception as e:
        return error_response(
            message="Error updating notification settings", 
            code="PERSONAL_NOTIFICATIONS_ENABLED_UPDATE_ERROR",
            i18n_key="api.calendar.notifications_update_error", 
            status_code=500, 
            error=str(e),
            log_extra={"calendar_id": calendar_id}
        )