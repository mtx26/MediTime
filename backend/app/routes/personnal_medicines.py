from flask import request, g
from app.utils.auth import require_auth
from . import api
from app.services.calendar import verify_calendar, add_pillbox_uses, get_if_pillbox_is_used
from app.services.medication import update_box, create_box, delete_box, get_boxes, restock_box
from app.utils.responses import success_response, error_response, warning_response
from app.services.medication import use_pillbox
from datetime import datetime, timezone
from app.utils.measure import measure_time
from app.utils import with_query_origin

ERROR_UNAUTHORIZED_ACCESS = "accès refusé"

# Route pour récupérer les boites de médicaments d'un calendrier
@api.route("/calendars/<calendar_id>/boxes", methods=["GET"])
@measure_time()
@require_auth
@verify_calendar
@with_query_origin(default_origin="REALTIME_PERSONAL_CALENDAR_BOXES")
def handle_boxes(calendar_id):
    try:
        boxes = get_boxes(calendar_id)

        return success_response(
            message="boites de médicaments récupérées",
            code="MEDICINE_BOXES_FETCHED",
            data={"boxes": boxes},
            log_extra={"calendar_id": calendar_id, "boxes_count": len(boxes) if boxes is not None else 0}
        )

    except Exception as e:
        return error_response(
            message="erreur lors de la récupération des boites de médicaments",
            code="GET_MEDICINE_BOXES_ERROR",
            status_code=500,
            error=str(e),
            log_extra={"calendar_id": calendar_id}
        )


# Route pour modifier une boite de médicaments
@api.route("/calendars/<calendar_id>/boxes/<box_id>", methods=["PUT"])
@measure_time()
@require_auth
@verify_calendar
@with_query_origin(default_origin="BOX_UPDATE")
def handle_update_box(calendar_id, box_id):
    try:

        payload = request.get_json(force=True)
        box = payload.get("box")

        if not box:
            return warning_response(
                message="champs requis manquants",
                code="MISSING_REQUIRED_FIELDS",
                status_code=400,
                log_extra={"calendar_id": calendar_id, "box_id": box_id}
            )

        update_box(box_id, calendar_id, box)
        
        return success_response(
            message="boite de médicaments modifiée",
            code="MEDICINE_BOX_UPDATED",
            log_extra={"calendar_id": calendar_id, "box_id": box_id}
        )

    except Exception as e:
        return error_response(
            message="erreur lors de la modification de la boite de médicaments",
            code="UPDATE_MEDICINE_BOX_ERROR",
            status_code=500,
            error=str(e),
            log_extra={"calendar_id": calendar_id, "box_id": box_id}
        )

# Route pour créer une boite de médicaments
@api.route("/calendars/<calendar_id>/boxes", methods=["POST"])
@measure_time()
@require_auth
@verify_calendar
@with_query_origin(default_origin="BOX_CREATE")
def handle_create_box(calendar_id):
    try:

        payload = request.get_json(force=True)
        box = payload.get("box")

        if not box:
            return warning_response(
                message="champs requis manquants",
                code="MISSING_REQUIRED_FIELDS",
                status_code=400,
                log_extra={"calendar_id": calendar_id}
            )

        box_id = create_box(calendar_id, box)

        return success_response(
            message="boite de médicaments créée",
            code="MEDICINE_BOX_CREATED",
            data={"box_id": box_id},
            log_extra={"calendar_id": calendar_id}
        )

    except Exception as e:
        return error_response(
            message="erreur lors de la création de la boite de médicaments",
            code="CREATE_MEDICINE_BOX_ERROR",
            status_code=500,
            error=str(e),
            log_extra={"calendar_id": calendar_id}
        )

# Route pour supprimer une boite de médicaments
@api.route("/calendars/<calendar_id>/boxes/<box_id>", methods=["DELETE"])
@measure_time()
@require_auth
@verify_calendar
@with_query_origin(default_origin="BOX_DELETE")
def handle_delete_box(calendar_id, box_id):
    try:

        delete_box(box_id, calendar_id)
        
        return success_response(
            message="boite de médicaments supprimée",
            code="MEDICINE_BOX_DELETED",
            log_extra={"calendar_id": calendar_id, "box_id": box_id}
        )

    except Exception as e:
        return error_response(
            message="erreur lors de la suppression de la boite de médicaments",
            code="DELETE_MEDICINE_BOX_ERROR",
            status_code=500,
            error=str(e),
            log_extra={"calendar_id": calendar_id, "box_id": box_id}
        )

# Route pour getter si le pillbox d'un calendrier a été utilisé
@api.route("/calendars/<calendar_id>/pillboxs/used", methods=["GET"])
@measure_time()
@require_auth
@verify_calendar
@with_query_origin(default_origin="GET_PILLBOX_USED")
def handle_get_if_pillbox_used(calendar_id):
    try:
        start_date = request.args.get("startDate")

        if not start_date:
            start_date = datetime.now(timezone.utc).date()
        else:
            start_date = datetime.strptime(start_date, "%Y-%m-%d").date()

        if_pillbox_used = get_if_pillbox_is_used(calendar_id, start_date)
        print(if_pillbox_used)
        return success_response(
            message="statut d'utilisation du pillbox récupéré",
            code="PILLBOX_USED_STATUS_FETCHED",
            data={"if_pillbox_used": if_pillbox_used},
            log_extra={"calendar_id": calendar_id}
        )

    except Exception as e:
        return error_response(
            message="erreur lors de la récupération du statut d'utilisation du pillbox",
            code="GET_PILLBOX_USED_STATUS_ERROR",
            status_code=500,
            error=str(e),
            log_extra={"calendar_id": calendar_id}
        )

# Route pour utiliser le pillbox d'un calendrier
@api.route("/calendars/<calendar_id>/pillboxs/used", methods=["POST"])
@measure_time()
@require_auth
@verify_calendar
@with_query_origin(default_origin="USE_PILLBOX")
def handle_use_pillbox(calendar_id):
    try:
        payload = request.get_json(force=True)
        start_date = payload.get("startDate")
        
        if not start_date:
            start_date = datetime.now(timezone.utc).date()
        else:
            start_date = datetime.strptime(start_date, "%Y-%m-%d").date()

        if add_pillbox_uses(calendar_id, g.uid, start_date):
            result = use_pillbox(calendar_id, start_date)

            if result == False:
                return warning_response(
                    message="aucun médicament à utiliser",
                    code="NO_MEDICATION_TO_USE",
                    status_code=404,
                    log_extra={"calendar_id": calendar_id}
                )
            elif result is None:
                return warning_response(
                    message="mode de décompte non supporté",
                    code="UNSUPPORTED_DECREMENT_MODE",
                    status_code=400,
                    log_extra={"calendar_id": calendar_id}
                )
            return success_response(
                message="médicaments utilisés",
                code="PILLBOX_MEDICATION_USED",
                log_extra={"calendar_id": calendar_id}
            )
        else:
            return warning_response(
                message="le pillbox a déjà été utilisé pour cette période",
                code="PILLBOX_ALREADY_USED",
                status_code=400,
                log_extra={"calendar_id": calendar_id}
            )
    except Exception as e:
        return error_response(
            message="erreur lors de l'utilisation du pillbox",
            code="USE_PILLBOX_MEDICATION_ERROR",
            status_code=500,
            error=str(e),
            log_extra={"calendar_id": calendar_id}
        )
    
@api.route("/calendars/<calendar_id>/boxes/<box_id>/restock", methods=["POST"])
@measure_time()
@require_auth
@verify_calendar
@with_query_origin(default_origin="BOX_RESTOCK")
def handle_restock_box(calendar_id, box_id):
    try:

        if not restock_box(box_id, calendar_id):
            return warning_response(
                message="boite de médicaments non trouvée",
                code="MEDICINE_BOX_NOT_FOUND",
                status_code=404,
                log_extra={"calendar_id": calendar_id, "box_id": box_id}
            )

        return success_response(
            message="boite de médicaments réapprovisionnée",
            code="BOX_RESTOCKED_SUCCESS",
            data={"box_id": box_id},
            log_extra={"calendar_id": calendar_id, "box_id": box_id}
        )
    except Exception as e:
        return error_response(
            message="erreur lors du réapprovisionnement de la boite de médicaments",
            code="BOX_RESTOCK_ERROR",
            status_code=500,
            error=str(e),
            log_extra={"calendar_id": calendar_id, "box_id": box_id}
        )
