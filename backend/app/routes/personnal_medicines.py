from flask import request, g
from app.utils.auth import require_auth
from . import api
from app.services.calendar import verify_calendar
from app.services.medication import update_box, create_box, delete_box, get_boxes, restock_box
from app.utils.responses import success_response, error_response, warning_response
from app.services.medication import use_pillulier
from datetime import datetime, timezone
from app.utils.measure import measure_time

ERROR_UNAUTHORIZED_ACCESS = "accès refusé"

# Route pour récupérer les boites de médicaments d'un calendrier
@api.route("/calendars/<calendar_id>/boxes", methods=["GET"])
@measure_time()
@require_auth
@verify_calendar
def handle_boxes(calendar_id):
    try:
        uid = g.uid

        boxes = get_boxes(calendar_id)

        return success_response(
            message="boites de médicaments récupérées",
            code="MEDICINE_BOXES_FETCHED",
            uid=uid,
            origin="GET_MEDICINE_BOXES",
            data={"boxes": boxes},
            log_extra={"calendar_id": calendar_id, "boxes_count": len(boxes) if boxes is not None else 0}
        )

    except Exception as e:
        return error_response(
            message="erreur lors de la récupération des boites de médicaments",
            code="GET_MEDICINE_BOXES_ERROR",
            status_code=500,
            uid=uid,
            origin="GET_MEDICINE_BOXES",
            error=str(e),
            log_extra={"calendar_id": calendar_id}
        )


# Route pour modifier une boite de médicaments
@api.route("/calendars/<calendar_id>/boxes/<box_id>", methods=["PUT"])
@measure_time()
@require_auth
@verify_calendar
def handle_update_box(calendar_id, box_id):
    try:
        uid = g.uid

        payload = request.get_json(force=True)
        box = payload.get("box")

        if not box:
            return warning_response(
                message="champs requis manquants",
                code="MISSING_REQUIRED_FIELDS",
                status_code=400,
                uid=uid,
                origin="UPDATE_MEDICINE_BOX",
                log_extra={"calendar_id": calendar_id, "box_id": box_id}
            )

        update_box(box_id, calendar_id, box)
        
        return success_response(
            message="boite de médicaments modifiée",
            code="MEDICINE_BOX_UPDATED",
            uid=uid,
            origin="UPDATE_MEDICINE_BOX",
            log_extra={"calendar_id": calendar_id, "box_id": box_id}
        )

    except Exception as e:
        return error_response(
            message="erreur lors de la modification de la boite de médicaments",
            code="UPDATE_MEDICINE_BOX_ERROR",
            status_code=500,
            uid=uid,
            origin="UPDATE_MEDICINE_BOX",
            error=str(e),
            log_extra={"calendar_id": calendar_id, "box_id": box_id}
        )

# Route pour créer une boite de médicaments
@api.route("/calendars/<calendar_id>/boxes", methods=["POST"])
@measure_time()
@require_auth
@verify_calendar
def handle_create_box(calendar_id):
    try:
        uid = g.uid

        payload = request.get_json(force=True)
        box = payload.get("box")

        if not box:
            return warning_response(
                message="champs requis manquants",
                code="MISSING_REQUIRED_FIELDS",
                status_code=400,
                uid=uid,
                origin="CREATE_MEDICINE_BOX",
                log_extra={"calendar_id": calendar_id}
            )

        box_id = create_box(calendar_id, box)

        return success_response(
            message="boite de médicaments créée",
            code="MEDICINE_BOX_CREATED",
            uid=uid,
            origin="CREATE_MEDICINE_BOX",
            data={"box_id": box_id},
            log_extra={"calendar_id": calendar_id}
        )

    except Exception as e:
        return error_response(
            message="erreur lors de la création de la boite de médicaments",
            code="CREATE_MEDICINE_BOX_ERROR",
            status_code=500,
            uid=uid,
            origin="CREATE_MEDICINE_BOX",
            error=str(e),
            log_extra={"calendar_id": calendar_id}
        )

# Route pour supprimer une boite de médicaments
@api.route("/calendars/<calendar_id>/boxes/<box_id>", methods=["DELETE"])
@measure_time()
@require_auth
@verify_calendar
def handle_delete_box(calendar_id, box_id):
    try:
        uid = g.uid

        delete_box(box_id, calendar_id)
        
        return success_response(
            message="boite de médicaments supprimée",
            code="MEDICINE_BOX_DELETED",
            uid=uid,
            origin="DELETE_MEDICINE_BOX",
            log_extra={"calendar_id": calendar_id, "box_id": box_id}
        )

    except Exception as e:
        return error_response(
            message="erreur lors de la suppression de la boite de médicaments",
            code="DELETE_MEDICINE_BOX_ERROR",
            status_code=500,
            uid=uid,
            origin="DELETE_MEDICINE_BOX",
            error=str(e),
            log_extra={"calendar_id": calendar_id, "box_id": box_id}
        )

@api.route("/calendars/<calendar_id>/pilluliers/used", methods=["POST"])
@measure_time()
@require_auth
@verify_calendar
def handle_use_pillulier(calendar_id):
    try:
        uid = g.uid
        
        payload = request.get_json(force=True)
        start_date = payload.get("startTime")
        
        if not start_date:
            start_date = datetime.now(timezone.utc).date()
        else:
            start_date = datetime.strptime(start_date, "%Y-%m-%d").date()

        result = use_pillulier(calendar_id, start_date)

        if result == False:
            return warning_response(
                message="aucun médicament à utiliser",
                code="NO_MEDICATION_TO_USE",
                status_code=404,
                uid=uid,
                origin="USE_PILLULIER_MEDICATION",
                log_extra={"calendar_id": calendar_id}
            )
        elif result is None:
            return warning_response(
                message="mode de décompte non supporté",
                code="UNSUPPORTED_DECREMENT_MODE",
                status_code=400,
                uid=uid,
                origin="USE_PILLULIER_MEDICATION",
                log_extra={"calendar_id": calendar_id}
            )
        return success_response(
            message="médicaments utilisés",
            code="PILLULIER_MEDICATION_USED",
            uid=uid,
            origin="USE_PILLULIER_MEDICATION",
            log_extra={"calendar_id": calendar_id}
        )
    except Exception as e:
        return error_response(
            message="erreur lors de l'utilisation du pillulier",
            code="USE_PILLULIER_MEDICATION_ERROR",
            status_code=500,
            uid=uid,
            origin="USE_PILLULIER_MEDICATION",
            error=str(e),
            log_extra={"calendar_id": calendar_id}
        )
    
@api.route("/calendars/<calendar_id>/boxes/<box_id>/restock", methods=["POST"])
@measure_time()
@require_auth
@verify_calendar
def handle_restock_box(calendar_id, box_id):
    try:
        uid = g.uid

        if not restock_box(box_id, calendar_id):
            return warning_response(
                message="boite de médicaments non trouvée",
                code="MEDICINE_BOX_NOT_FOUND",
                status_code=404,
                uid=uid,
                origin="RESTOCK_MEDICINE_BOX",
                log_extra={"calendar_id": calendar_id, "box_id": box_id}
            )

        return success_response(
            message="boite de médicaments réapprovisionnée",
            code="MEDICINE_BOX_RESTOCKED",
            uid=uid,
            origin="RESTOCK_MEDICINE_BOX",
            data={"box_id": box_id},
            log_extra={"calendar_id": calendar_id, "box_id": box_id}
        )
    except Exception as e:
        return error_response(
            message="erreur lors du réapprovisionnement de la boite de médicaments",
            code="RESTOCK_MEDICINE_BOX_ERROR",
            status_code=500,
            uid=uid,
            origin="RESTOCK_MEDICINE_BOX",
            error=str(e),
            log_extra={"calendar_id": calendar_id, "box_id": box_id}
        )
