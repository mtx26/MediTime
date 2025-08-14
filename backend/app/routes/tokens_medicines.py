from . import api
from flask import g
from app.db.connection import get_connection
from app.services.calendar import verify_token
from app.utils.responses import success_response, error_response
from app.utils.measure import measure_time
from app.utils import with_query_origin


# Route pour obtenir les médicaments d’un token public
@api.route("/tokens/<token>/medicines", methods=["GET"])
@measure_time()
@verify_token
@with_query_origin(default_origin="REALTIME_TOKEN_MEDICINES")
def handle_token_medicines(token):
    try:
        calendar_id = g.calendar_id

        with get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute("""
                    SELECT
                        cond.*, 
                        box.name,
                        box.dose,
                        box.box_capacity,
                        box.stock_quantity,
                        box.stock_alert_threshold
                    FROM medicine_box_conditions cond
                    JOIN medicine_boxes box ON cond.box_id = box.id
                    WHERE box.calendar_id = %s
                """, (calendar_id,))
                medicines = cursor.fetchall()

        return success_response(
            message="médicaments récupérés",
            code="MEDICINES_SHARED_LOADED",
            data={"medicines": medicines},
            log_extra={"token": token}
        )

    except Exception as e:
        return error_response(
            message="erreur lors de la récupération des médicaments",
            code="MEDICINES_SHARED_ERROR",
            status_code=500,
            error=str(e),
            log_extra={"token": token}
        )
