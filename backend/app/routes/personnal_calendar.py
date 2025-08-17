from . import api
from app.utils import require_auth
from datetime import datetime, timezone
from flask import request, g, Response
from app.db.connection import get_connection
from app.services.calendar import generate_calendar_schedule, update_stock_decrement_method
from app.services.calendar import verify_calendar
from app.utils.responses import success_response, error_response, warning_response
from app.utils.logging import log_backend
from app.services.documents import generate_medicine_conditions_pdf
from app.services.medication import check_if_stock_is_low
from app.utils import measure_time, elapsed_now
from app.utils import with_query_origin

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
                        COUNT(mb.id) AS count
                    FROM calendars c
                    LEFT JOIN medicine_boxes mb 
                        ON mb.calendar_id = c.id
                    WHERE c.owner_uid = %s
                    GROUP BY c.id
                """, (uid,))
                calendars = cursor.fetchall()

                if not calendars:
                    return warning_response(
                        message=ERROR_CALENDAR_NOT_FOUND, 
                        code="CALENDAR_FETCH_ERROR", 
                        status_code=404
                    )

                for calendar in calendars:
                    calendar["boxesCount"] = calendar.get("count", 0)
                    calendar["ifLowStock"] = check_if_stock_is_low(calendar["id"])

        return success_response(
            message="calendriers récupérés", 
            code="CALENDAR_FETCH_SUCCESS", 
            data={"calendars": calendars},
        )
    except Exception as e:
        return error_response(
            message="erreur lors de la récupération des calendriers", 
            code="CALENDAR_FETCH_ERROR", 
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
                message="nom de calendrier manquant", 
                code="CALENDAR_CREATE_ERROR", 
                status_code=400, 
                log_extra={"calendar_name": calendar_name}
            )

        with get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute("INSERT INTO calendars (owner_uid, name) VALUES (%s, %s) RETURNING id", (uid, calendar_name))
                calendar_id = cursor.fetchone().get("id")
                conn.commit()

        return success_response(
            message="calendrier créé", 
            code="CALENDAR_CREATE", 
            data={"calendarId": calendar_id, "calendarName": calendar_name},
            log_extra={"calendar_name": calendar_name}
        )

    except Exception as e:
        return error_response(
            message="erreur lors de la création du calendrier", 
            code="CALENDAR_CREATE_ERROR", 
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
                message="identifiant de calendrier invalide",
                code="CALENDAR_DELETE_ERROR",
                status_code=400,
                log_extra={"calendar_id": calendar_id}
            )

        with get_connection() as conn:
            with conn.cursor() as cursor:
                # Supprime et vérifie en une seule requête
                cursor.execute("""
                    DELETE FROM calendars
                    WHERE id = %s
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
            message="calendrier supprimé",
            code="CALENDAR_DELETE_SUCCESS",
            log_extra={"calendar_id": calendar_id}
        )

    except Exception as e:
        return error_response(
            message="erreur lors de la suppression du calendrier",
            code="CALENDAR_DELETE_ERROR",
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
                message="nom de calendrier manquant",
                code="CALENDAR_RENAME_ERROR",
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
                log_extra={"calendar_id": calendar_id, "new_calendar_name": new_calendar_name}
            )

        # Cas: même nom qu'avant
        if row.get("same"):
            return warning_response(
                message="le nom de calendrier est déjà le même",
                code="CALENDAR_RENAME_ERROR",
                status_code=400,
                log_extra={
                    "calendar_id": calendar_id,
                    "old_calendar_name": row.get("old_name"),
                    "new_calendar_name": new_calendar_name
                }
            )

        # Succès
        return success_response(
            message="calendrier renommé",
            code="CALENDAR_RENAME_SUCCESS",
            log_extra={
                "calendar_id": row.get("calendar_id") or calendar_id,
                "old_calendar_name": row.get("old_name"),
                "new_calendar_name": row.get("new_name") or new_calendar_name
            }
        )

    except Exception as e:
        return error_response(
            message="erreur lors de la renommation du calendrier",
            code="CALENDAR_RENAME_ERROR",
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
            message="calendrier généré", 
            code="CALENDAR_GENERATE_SUCCESS",
            data={"schedule": schedule, "table": table, "calendar_name": calendar_name, "if_low_stock": if_low_stock},
            log_extra={"calendar_id": calendar_id}
        )

    except Exception as e:
        return error_response(
            message="erreur lors de la génération du calendrier", 
            code="CALENDAR_GENERATE_ERROR", 
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
                message="calendar_id manquant",
                code="MISSING_CALENDAR_ID",
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
            message="Erreur lors du téléchargement du PDF",
            code="PDF_DOWNLOAD_ERROR_CALENDAR",
            status_code=500,
            error=str(e)
        )

@api.route("/calendars/<calendar_id>/stock-decrement-method", methods=["GET"])
@measure_time()
@require_auth
@verify_calendar
@with_query_origin(default_origin="STOCK_DECREMENT_METHOD_FETCH")
def get_personnal_stock_decrement_method(calendar_id):
    try:
        with get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute("SELECT stock_decrement_method FROM calendars WHERE id = %s", (calendar_id,))
                result = cursor.fetchone()
                if result is None:
                    return warning_response(
                        message=ERROR_CALENDAR_NOT_FOUND,
                        code="STOCK_DECREMENT_METHOD_FETCH_ERROR",
                        status_code=404,
                        log_extra={"calendar_id": calendar_id}
                    )
                method = result.get("stock_decrement_method")

        return success_response(
            message="méthode de diminution de stock récupérée",
            code="STOCK_DECREMENT_METHOD_FETCH_SUCCESS",
            data={"method": method},
            log_extra={"calendar_id": calendar_id, "method": method}
        )
    except Exception as e:
        return error_response(
            message="erreur lors de la récupération de la méthode de diminution de stock",
            code="STOCK_DECREMENT_METHOD_FETCH_ERROR",
            status_code=500,
            error=str(e),
            log_extra={"calendar_id": calendar_id}
        )

    
@api.route("/calendars/<calendar_id>/stock-decrement-method", methods=["POST"])
@measure_time()
@require_auth
@verify_calendar
@with_query_origin(default_origin="STOCK_DECREMENT_METHOD_UPDATE")
def update_personnal_stock_decrement_method(calendar_id):
    try:

        payload = request.get_json(force=True)
        method = payload.get("method")

        if not method:
            return warning_response(
                message="method manquant",
                code="STOCK_DECREMENT_METHOD_UPDATE_ERROR",
                status_code=400,
                log_extra={"calendar_id": calendar_id}
            )

        update_stock_decrement_method(calendar_id, method)

        return success_response(
            message="methode de diminution de stock mise à jour", 
            code="STOCK_DECREMENT_METHOD_UPDATE_SUCCESS",
            log_extra={"calendar_id": calendar_id, "method": method}
        )
    except Exception as e:
        return error_response(
            message="erreur lors de la mise à jour de la méthode de diminution de stock", 
            code="STOCK_DECREMENT_METHOD_UPDATE_ERROR", 
            status_code=500, 
            error=str(e),
            log_extra={"calendar_id": calendar_id}
        )

