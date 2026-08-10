from flask import g
from . import api
from app.db.connection import get_connection
from app.utils.responses import success_response, error_response
from app.utils.decorators import measure_time, with_query_origin, verify_token


# Route pour obtenir les médicaments d’un token public
@api.route("/tokens/<token>/medicines", methods=["GET"])
@measure_time()
@verify_token
@with_query_origin(default_origin="REALTIME_TOKEN_MEDICINES")
def handle_token_medicines(token):
    try:
        # verify_token a déjà validé le token et résolu le calendrier associé.
        calendar_id = g.calendar_id

        # Le token est injecté en GUC transaction-local par get_connection, ce qui active
        # la policy "Public access via shared token". Le filtre sur calendar_id ci-dessous
        # est volontairement redondant : il cloisonne la requête même si la RLS venait à
        # ne pas s'appliquer (rôle propriétaire des tables, FORCE RLS absent, etc.).
        with get_connection(share_token=token) as conn:
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
                        AND cond.deleted_at IS NULL
                        AND box.deleted_at IS NULL
                """, (calendar_id,))
                medicines = cursor.fetchall()

        return success_response(
            message="retrieved medications",
            code="MEDICINES_SHARED_LOADED",
            i18n_key="api.shared_boxes.retrieved",
            data={"medicines": medicines},
            log_extra={"token": token}
        )

    except Exception as e:
        return error_response(
            message="error during medication retrieval",
            code="MEDICINES_SHARED_ERROR",
            i18n_key="api.shared_boxes.fetch_error",
            status_code=500,
            error=str(e),
            log_extra={"token": token}
        )
