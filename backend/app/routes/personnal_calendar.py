from . import api
from app.utils.auth import require_auth
from datetime import datetime, timezone
from flask import request, g, Response
from app.db.connection import get_connection
from app.services.calendar import generate_calendar_schedule, uptate_stock_decrement_method
from app.services.calendar import verify_calendar
from app.utils.responses import success_response, error_response, warning_response
from app.utils.logging import log_backend
from app.services.documents import generate_medicine_conditions_pdf
from app.services.medication import check_if_stock_is_low
from app.utils.measure import measure_time, elapsed_now


ERROR_CALENDAR_NOT_FOUND = "calendrier non trouvé"

# Route pour récupérer les calendriers de l'utilisateur
@api.route("/calendars", methods=["GET"])
@measure_time()
@require_auth
def handle_calendars():
    try:
        uid = g.uid
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
                        status_code=404, 
                        uid=uid, 
                        origin="CALENDAR_FETCH"
                    )

                for calendar in calendars:
                    calendar["boxesCount"] = calendar.get("count", 0)
                    calendar["ifLowStock"] = check_if_stock_is_low(calendar["id"])

        return success_response(
            message="calendriers récupérés", 
            code="CALENDAR_FETCH_SUCCESS", 
            uid=uid, 
            origin="CALENDAR_FETCH", 
            data={"calendars": calendars},
        )
    except Exception as e:
        return error_response(
            message="erreur lors de la récupération des calendriers", 
            code="CALENDAR_FETCH_ERROR", 
            status_code=500, 
            uid=uid, 
            origin="CALENDAR_FETCH", 
            error=str(e)
        )


# Route pour créer un calendrier
@api.route("/calendars", methods=["POST"])
@measure_time()
@require_auth
def handle_create_calendar():
    try:
        uid = g.uid
        payload = request.get_json(force=True)
        calendar_name = payload.get("calendarName")

        if not calendar_name:
            return warning_response(
                message="nom de calendrier manquant", 
                code="CALENDAR_CREATE_ERROR", 
                status_code=400, 
                uid=uid, 
                origin="CALENDAR_CREATE", 
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
            uid=uid, 
            origin="CALENDAR_CREATE",
            data={"calendarId": calendar_id, "calendarName": calendar_name},
            log_extra={"calendar_name": calendar_name}
        )

    except Exception as e:
        return error_response(
            message="erreur lors de la création du calendrier", 
            code="CALENDAR_CREATE_ERROR", 
            status_code=500, 
            uid=uid, 
            origin="CALENDAR_CREATE", 
            error=str(e)
        )


# Route pour supprimer un calendrier
@api.route("/calendars/<calendar_id>", methods=["DELETE"])
@measure_time()
@require_auth
@verify_calendar
def handle_delete_calendar(calendar_id):
    try:
        uid = g.uid

        if not calendar_id:
            return warning_response(
                message="identifiant de calendrier invalide",
                code="CALENDAR_DELETE_ERROR",
                status_code=400,
                uid=uid,
                origin="CALENDAR_DELETE_ERROR",
                log_extra={"calendar_id": calendar_id}
            )

        with get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute("SELECT * FROM calendars WHERE id = %s", (calendar_id,))
                calendar = cursor.fetchone()
                
                if calendar is None:
                    return warning_response(
                        message=ERROR_CALENDAR_NOT_FOUND, 
                        code="CALENDAR_DELETE_ERROR", 
                        status_code=404, 
                        uid=uid, 
                        origin="CALENDAR_DELETE_ERROR", 
                        log_extra={"calendar_id": calendar_id}
                    )

                cursor.execute("DELETE FROM calendars WHERE id = %s", (calendar_id,))
                conn.commit()

        return success_response(
            message="calendrier supprimé", 
            code="CALENDAR_DELETE_SUCCESS", 
            uid=uid, 
            origin="CALENDAR_DELETE", 
            log_extra={"calendar_id": calendar_id}
        )

    except Exception as e:
        return error_response(
            message="erreur lors de la suppression du calendrier", 
            code="CALENDAR_DELETE_ERROR", 
            status_code=500, 
            uid=uid, 
            origin="CALENDAR_DELETE", 
            error=str(e)
        )


# Route pour renommer un calendrier
@api.route("/calendars/<calendar_id>", methods=["PUT"])
@measure_time()
@require_auth
@verify_calendar
def handle_rename_calendar(calendar_id):
    try:
        uid = g.uid
        payload = request.get_json(force=True)

        new_calendar_name = payload.get("newCalendarName")

        if not new_calendar_name:
            return warning_response(
                message="nom de calendrier manquant",
                code="CALENDAR_RENAME_ERROR", 
                status_code=400, 
                uid=uid, 
                origin="CALENDAR_RENAME", 
                log_extra={"calendar_id": calendar_id, "new_calendar_name": new_calendar_name}
            )

        with get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute("SELECT name FROM calendars WHERE id = %s", (calendar_id,))
                result = cursor.fetchone()

                if result is None:
                    return warning_response(
                        message=ERROR_CALENDAR_NOT_FOUND, 
                        code="CALENDAR_RENAME_ERROR", 
                        status_code=404, 
                        uid=uid, 
                        origin="CALENDAR_RENAME", 
                        log_extra={"calendar_id": calendar_id, "new_calendar_name": new_calendar_name})

                old_name = result['name']

                if new_calendar_name == old_name:
                    return warning_response(
                        message="le nom de calendrier est déjà le même", 
                        code="CALENDAR_RENAME_ERROR", 
                        status_code=400, 
                        uid=uid, 
                        origin="CALENDAR_RENAME", 
                        log_extra={"calendar_id": calendar_id, "old_calendar_name": old_name, "new_calendar_name": new_calendar_name}
                    )
                cursor.execute(
                    "UPDATE calendars SET name = %s WHERE id = %s",
                    (new_calendar_name, calendar_id)
                )
                conn.commit()

        return success_response(
            message="calendrier renommé", 
            code="CALENDAR_RENAME_SUCCESS", 
            uid=uid, 
            origin="CALENDAR_RENAME", 
            log_extra={"calendar_id": calendar_id, "old_calendar_name": old_name, "new_calendar_name": new_calendar_name}
        )

    except Exception as e:
        return error_response(
            message="erreur lors de la renommation du calendrier", 
            code="CALENDAR_RENAME_ERROR", 
            status_code=500, 
            uid=uid, 
            origin="CALENDAR_RENAME", 
            error=str(e))
  

# Route pour générer le calendrier 
@api.route("/calendars/<calendar_id>/schedule", methods=["GET"])
@measure_time()
@require_auth
@verify_calendar
def handle_calendar_schedule(calendar_id):
    try:
        owner_uid = g.uid

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
            uid=owner_uid, 
            origin="CALENDAR_GENERATE", 
            data={"schedule": schedule, "table": table, "calendar_name": calendar_name, "if_low_stock": if_low_stock},
            log_extra={"calendar_id": calendar_id}
        )

    except Exception as e:
        return error_response(
            message="erreur lors de la génération du calendrier", 
            code="CALENDAR_GENERATE_ERROR", 
            status_code=500, 
            uid=owner_uid, 
            origin="CALENDAR_GENERATE", 
            error=str(e),
            log_extra={"calendar_id": calendar_id}
        )

@api.route("/calendars/<calendar_id>/pdf", methods=["GET"])
@measure_time()
def download_pdf_calendar(calendar_id):
    try:
        # TODO: Sécuriser cette route

        if not calendar_id:
            return error_response(
                message="calendar_id manquant",
                code="MISSING_CALENDAR_ID",
                status_code=400,
                origin="PDF_DOWNLOAD"
            )

        # Génère le PDF en mémoire
        pdf_buffer = generate_medicine_conditions_pdf(calendar_id)

        # Log facultatif
        log_backend.info("PDF généré avec succès", {
            "origin": "PDF_DOWNLOAD",
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
            origin="PDF_DOWNLOAD",
            error=str(e)
        )

@api.route("/calendars/<calendar_id>/stock-decrement-method", methods=["GET"])
@measure_time()
@require_auth
@verify_calendar
def get_personnal_stock_decrement_method(calendar_id):
    try:
        uid = g.uid
        with get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute("SELECT stock_decrement_method FROM calendars WHERE id = %s", (calendar_id,))
                result = cursor.fetchone()
                if result is None:
                    return warning_response(
                        message=ERROR_CALENDAR_NOT_FOUND,
                        code="STOCK_DECREMENT_METHOD_FETCH_ERROR",
                        status_code=404,
                        uid=uid,
                        origin="STOCK_DECREMENT_METHOD_FETCH",
                        log_extra={"calendar_id": calendar_id}
                    )
                method = result.get("stock_decrement_method")

        return success_response(
            message="méthode de diminution de stock récupérée",
            code="STOCK_DECREMENT_METHOD_FETCH_SUCCESS",
            uid=uid,
            origin="STOCK_DECREMENT_METHOD_FETCH",
            data={"method": method},
            log_extra={"calendar_id": calendar_id, "method": method}
        )
    except Exception as e:
        return error_response(
            message="erreur lors de la récupération de la méthode de diminution de stock",
            code="STOCK_DECREMENT_METHOD_FETCH_ERROR",
            status_code=500,
            uid=uid,
            origin="STOCK_DECREMENT_METHOD_FETCH",
            error=str(e),
            log_extra={"calendar_id": calendar_id}
        )

    
@api.route("/calendars/<calendar_id>/stock-decrement-method", methods=["POST"])
@measure_time()
@require_auth
@verify_calendar
def update_personnal_stock_decrement_method(calendar_id):
    try:
        uid = g.uid

        payload = request.get_json(force=True)
        method = payload.get("method")

        if not method:
            return warning_response(
                message="method manquant",
                code="STOCK_DECREMENT_METHOD_UPDATE_ERROR",
                status_code=400,
                uid=uid,
                origin="STOCK_DECREMENT_METHOD_UPDATE",
                log_extra={"calendar_id": calendar_id}
            )

        uptate_stock_decrement_method(calendar_id, method)

        return success_response(
            message="methode de diminution de stock mise à jour", 
            code="STOCK_DECREMENT_METHOD_UPDATE_SUCCESS",
            uid=uid,
            origin="STOCK_DECREMENT_METHOD_UPDATE",
            log_extra={"calendar_id": calendar_id, "method": method}
        )
    except Exception as e:
        return error_response(
            message="erreur lors de la mise à jour de la méthode de diminution de stock", 
            code="STOCK_DECREMENT_METHOD_UPDATE_ERROR", 
            status_code=500, 
            uid=uid, 
            origin="STOCK_DECREMENT_METHOD_UPDATE", 
            error=str(e),
            log_extra={"calendar_id": calendar_id}
        )

