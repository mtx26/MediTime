from flask import request, g
from app.utils.auth import require_auth
from app.utils.responses import success_response, error_response, warning_response
from app.services.medication import (
    update_box,
    create_box,
    delete_box,
    get_boxes,
    restock_box,
    use_pillulier,
)
from datetime import datetime, timezone
import time


def register_medicine_routes(api, base_path, verify_calendar, unauthorized_message):
    """Register medicine box routes for a given calendar scope."""

    @api.route(f"{base_path}/boxes", methods=["GET"])
    @require_auth
    def handle_boxes(calendar_id):
        try:
            t_0 = time.time()
            uid = g.uid
            if not verify_calendar(calendar_id, uid):
                return warning_response(
                    message=unauthorized_message,
                    code="UNAUTHORIZED_ACCESS",
                    status_code=404,
                    uid=uid,
                    origin="GET_MEDICINE_BOXES",
                    log_extra={"calendar_id": calendar_id},
                )
            boxes = get_boxes(calendar_id)
            t_1 = time.time()
            return success_response(
                message="boites de médicaments récupérées",
                code="MEDICINE_BOXES_FETCHED",
                uid=uid,
                origin="GET_MEDICINE_BOXES",
                data={"boxes": boxes},
                log_extra={"time": t_1 - t_0, "calendar_id": calendar_id, "boxes_count": len(boxes) if boxes else 0},
            )
        except Exception as e:  # pragma: no cover - defensive
            return error_response(
                message="erreur lors de la récupération des boites de médicaments",
                code="GET_MEDICINE_BOXES_ERROR",
                status_code=500,
                uid=uid,
                origin="GET_MEDICINE_BOXES",
                error=str(e),
                log_extra={"calendar_id": calendar_id},
            )

    @api.route(f"{base_path}/boxes/<box_id>", methods=["PUT"])
    @require_auth
    def handle_update_box(calendar_id, box_id):
        try:
            t_0 = time.time()
            uid = g.uid
            data = request.get_json()
            if not data or not verify_calendar(calendar_id, uid):
                return warning_response(
                    message="champs requis manquants",
                    code="MISSING_REQUIRED_FIELDS",
                    status_code=400,
                    uid=uid,
                    origin="UPDATE_MEDICINE_BOX",
                    log_extra={"calendar_id": calendar_id, "box_id": box_id},
                )
            update_box(box_id, calendar_id, data)
            t_1 = time.time()
            return success_response(
                message="boite de médicaments modifiée",
                code="MEDICINE_BOX_UPDATED",
                uid=uid,
                origin="UPDATE_MEDICINE_BOX",
                log_extra={"time": t_1 - t_0, "calendar_id": calendar_id, "box_id": box_id},
            )
        except Exception as e:  # pragma: no cover - defensive
            return error_response(
                message="erreur lors de la modification de la boite de médicaments",
                code="UPDATE_MEDICINE_BOX_ERROR",
                status_code=500,
                uid=uid,
                origin="UPDATE_MEDICINE_BOX",
                error=str(e),
                log_extra={"calendar_id": calendar_id, "box_id": box_id},
            )

    @api.route(f"{base_path}/boxes", methods=["POST"])
    @require_auth
    def handle_create_box(calendar_id):
        try:
            t_0 = time.time()
            uid = g.uid
            data = request.get_json()
            if not data or not verify_calendar(calendar_id, uid):
                return warning_response(
                    message="champs requis manquants",
                    code="MISSING_REQUIRED_FIELDS",
                    status_code=400,
                    uid=uid,
                    origin="CREATE_MEDICINE_BOX",
                    log_extra={"calendar_id": calendar_id},
                )
            box_id = create_box(calendar_id, data)
            t_1 = time.time()
            return success_response(
                message="boite de médicaments créée",
                code="MEDICINE_BOX_CREATED",
                uid=uid,
                origin="CREATE_MEDICINE_BOX",
                data={"box_id": box_id},
                log_extra={"time": t_1 - t_0, "calendar_id": calendar_id},
            )
        except Exception as e:  # pragma: no cover - defensive
            return error_response(
                message="erreur lors de la création de la boite de médicaments",
                code="CREATE_MEDICINE_BOX_ERROR",
                status_code=500,
                uid=uid,
                origin="CREATE_MEDICINE_BOX",
                error=str(e),
                log_extra={"calendar_id": calendar_id},
            )

    @api.route(f"{base_path}/boxes/<box_id>", methods=["DELETE"])
    @require_auth
    def handle_delete_box(calendar_id, box_id):
        try:
            t_0 = time.time()
            uid = g.uid
            if not verify_calendar(calendar_id, uid):
                return warning_response(
                    message=unauthorized_message,
                    code="UNAUTHORIZED_ACCESS",
                    status_code=404,
                    uid=uid,
                    origin="DELETE_MEDICINE_BOX",
                    log_extra={"calendar_id": calendar_id},
                )
            delete_box(box_id, calendar_id)
            t_1 = time.time()
            return success_response(
                message="boite de médicaments supprimée",
                code="MEDICINE_BOX_DELETED",
                uid=uid,
                origin="DELETE_MEDICINE_BOX",
                log_extra={"time": t_1 - t_0, "calendar_id": calendar_id, "box_id": box_id},
            )
        except Exception as e:  # pragma: no cover - defensive
            return error_response(
                message="erreur lors de la suppression de la boite de médicaments",
                code="DELETE_MEDICINE_BOX_ERROR",
                status_code=500,
                uid=uid,
                origin="DELETE_MEDICINE_BOX",
                error=str(e),
                log_extra={"calendar_id": calendar_id, "box_id": box_id},
            )

    @api.route(f"{base_path}/pilluliers/used", methods=["POST"])
    @require_auth
    def handle_use_pillulier(calendar_id):
        try:
            t_0 = time.time()
            uid = g.uid
            start_date = request.args.get("startTime")
            if not start_date:
                start_date = datetime.now(timezone.utc).date()
            else:
                start_date = datetime.strptime(start_date, "%Y-%m-%d").date()
            if not verify_calendar(calendar_id, uid):
                return warning_response(
                    message=unauthorized_message,
                    code="UNAUTHORIZED_ACCESS",
                    status_code=404,
                    uid=uid,
                    origin="USE_PILLULIER_MEDICATION",
                    log_extra={"calendar_id": calendar_id},
                )
            result = use_pillulier(calendar_id, start_date)
            t_1 = time.time()
            if result is False:
                return warning_response(
                    message="aucun médicament à utiliser",
                    code="NO_MEDICATION_TO_USE",
                    status_code=404,
                    uid=uid,
                    origin="USE_PILLULIER_MEDICATION",
                    log_extra={"calendar_id": calendar_id},
                )
            if result is None:
                return warning_response(
                    message="mode de décompte non supporté",
                    code="UNSUPPORTED_DECREMENT_MODE",
                    status_code=400,
                    uid=uid,
                    origin="USE_PILLULIER_MEDICATION",
                    log_extra={"calendar_id": calendar_id},
                )
            return success_response(
                message="médicaments utilisés",
                code="PILLULIER_MEDICATION_USED",
                uid=uid,
                origin="USE_PILLULIER_MEDICATION",
                log_extra={"time": t_1 - t_0, "calendar_id": calendar_id},
            )
        except Exception as e:  # pragma: no cover - defensive
            return error_response(
                message="erreur lors de l'utilisation du pillulier",
                code="USE_PILLULIER_MEDICATION_ERROR",
                status_code=500,
                uid=uid,
                origin="USE_PILLULIER_MEDICATION",
                error=str(e),
                log_extra={"calendar_id": calendar_id},
            )

    @api.route(f"{base_path}/boxes/<box_id>/restock", methods=["POST"])
    @require_auth
    def handle_restock_box(calendar_id, box_id):
        try:
            t_0 = time.time()
            uid = g.uid
            if not verify_calendar(calendar_id, uid):
                return warning_response(
                    message=unauthorized_message,
                    code="UNAUTHORIZED_ACCESS",
                    status_code=404,
                    uid=uid,
                    origin="RESTOCK_MEDICINE_BOX",
                    log_extra={"calendar_id": calendar_id, "box_id": box_id},
                )
            if not restock_box(box_id, calendar_id):
                return warning_response(
                    message="boite de médicaments non trouvée",
                    code="MEDICINE_BOX_NOT_FOUND",
                    status_code=404,
                    uid=uid,
                    origin="RESTOCK_MEDICINE_BOX",
                    log_extra={"calendar_id": calendar_id, "box_id": box_id},
                )
            t_1 = time.time()
            return success_response(
                message="boite de médicaments réapprovisionnée",
                code="MEDICINE_BOX_RESTOCKED",
                uid=uid,
                origin="RESTOCK_MEDICINE_BOX",
                data={"box_id": box_id},
                log_extra={"time": t_1 - t_0, "calendar_id": calendar_id, "box_id": box_id},
            )
        except Exception as e:  # pragma: no cover - defensive
            return error_response(
                message="erreur lors du réapprovisionnement de la boite de médicaments",
                code="RESTOCK_MEDICINE_BOX_ERROR",
                status_code=500,
                uid=uid,
                origin="RESTOCK_MEDICINE_BOX",
                error=str(e),
                log_extra={"calendar_id": calendar_id, "box_id": box_id},
            )

    return [
        handle_boxes,
        handle_update_box,
        handle_create_box,
        handle_delete_box,
        handle_use_pillulier,
        handle_restock_box,
    ]
