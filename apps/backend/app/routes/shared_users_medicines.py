from flask import request, g
from . import api
from datetime import datetime, timezone
from app.services.calendar import add_pillbox_uses, get_if_pillbox_is_used, get_pillbox_uses, delete_pillbox_use
from app.services.medication import get_boxes, update_box, create_box, delete_box, restock_box, use_pillbox
from app.utils.responses import success_response, error_response, warning_response
from app.utils.decorators import require_auth, verify_calendar_share, measure_time, with_query_origin

# Route pour récupérer les boites de médicaments d'un calendrier
@api.route("/shared/users/calendars/<calendar_id>/boxes", methods=["GET"])
@measure_time()
@require_auth
@verify_calendar_share
@with_query_origin(default_origin="REALTIME_SHARED_CALENDAR_BOXES")
def handle_shared_boxes(calendar_id):
    try:

        boxes = get_boxes(calendar_id)

        return success_response(
            message="recovered medicine boxes",
            code="MEDICINE_BOXES_FETCHED",
            i18n_key="api.shared_boxes.retrieved",
            data={"boxes": boxes},
            log_extra={"calendar_id": calendar_id, "boxes_count": len(boxes)}
        )

    except Exception as e:
        return error_response(
            message="error during the retrieval of medicine boxes",
            code="GET_MEDICINE_BOXES_ERROR",
            i18n_key="api.shared_boxes.fetch_error",
            status_code=500,
            error=str(e),
            log_extra={"calendar_id": calendar_id}
        )


# Route pour modifier une boite de médicaments
@api.route("/shared/users/calendars/<calendar_id>/boxes/<box_id>", methods=["PUT"])
@measure_time()
@require_auth
@verify_calendar_share
@with_query_origin(default_origin="BOX_UPDATE")
def handle_update_shared_box(calendar_id, box_id):
    try:

        payload = request.get_json(force=True)
        box = payload.get("box")

        if not box:
            return warning_response(
                message="Missing required fields",
                code="MISSING_REQUIRED_FIELDS",
                i18n_key="api.shared_boxes.missing_fields",
                status_code=400,
                log_extra={"calendar_id": calendar_id, "box_id": box_id}
            )

        update_box(box_id, calendar_id, box)

        return success_response(
            message="modified medicine box",
            code="MEDICINE_BOX_UPDATED",
            i18n_key="api.shared_boxes.updated",
            log_extra={"calendar_id": calendar_id, "box_id": box_id}
        )

    except Exception as e:
        return error_response(
            message="error during modification of the medicine box",
            code="UPDATE_MEDICINE_BOX_ERROR",
            i18n_key="api.shared_boxes.update_error",
            status_code=500,
            error=str(e),
            log_extra={"calendar_id": calendar_id, "box_id": box_id}
        )

# Route pour créer une boite de médicaments
@api.route("/shared/users/calendars/<calendar_id>/boxes", methods=["POST"])
@measure_time()
@require_auth
@verify_calendar_share
@with_query_origin(default_origin="BOX_CREATE")
def handle_create_shared_box(calendar_id):
    try:

        payload = request.get_json(force=True)
        box = payload.get("box")

        if not box:
            return warning_response(
                message="Missing required fields",
                code="MISSING_REQUIRED_FIELDS",
                i18n_key="api.shared_boxes.missing_fields",
                status_code=400,
                log_extra={"calendar_id": calendar_id}
            )

        box_id = create_box(calendar_id, box)

        return success_response(
            message="medicine box created",
            code="MEDICINE_BOX_CREATED",
            i18n_key="api.shared_boxes.created",
            data={"box_id": box_id},
            log_extra={"calendar_id": calendar_id}
        )

    except Exception as e:
        return error_response(
            message="error occurred while creating the medicine box",
            code="CREATE_MEDICINE_BOX_ERROR",
            i18n_key="api.shared_boxes.creation_error",
            status_code=500,
            error=str(e),
            log_extra={"calendar_id": calendar_id}
        )

# Route pour supprimer une boite de médicaments
@api.route("/shared/users/calendars/<calendar_id>/boxes/<box_id>", methods=["DELETE"])
@measure_time()
@require_auth
@verify_calendar_share
@with_query_origin(default_origin="BOX_DELETE")
def handle_delete_shared_box(calendar_id, box_id):
    try:
        delete_box(box_id, calendar_id)

        return success_response(
            message="medicine box removed",
            code="MEDICINE_BOX_DELETED",
            i18n_key="api.shared_boxes.deleted",
            log_extra={"calendar_id": calendar_id, "box_id": box_id}
        )

    except Exception as e:
        return error_response(
            message="Error while deleting the medicine box",
            code="DELETE_MEDICINE_BOX_ERROR",
            i18n_key="api.shared_boxes.delete_error",
            status_code=500,
            error=str(e),
            log_extra={"calendar_id": calendar_id, "box_id": box_id}
        )

# Route pour get si une pillbox est utilisé
@api.route("/shared/users/calendars/<calendar_id>/pillbox/used", methods=["GET"])
@measure_time()
@require_auth
@verify_calendar_share
@with_query_origin(default_origin="GET_SHARED_PILLBOX_USED")
def handle_get_if_shared_pillbox_used(calendar_id):
    try:
        start_date = request.args.get("startDate")

        if not start_date:
            start_date = datetime.now(timezone.utc).date()
        else:
            start_date = datetime.strptime(start_date, "%Y-%m-%d").date()

        if_pillbox_used = get_if_pillbox_is_used(calendar_id, start_date)

        return success_response(
            message="Pillbox usage status retrieved",
            code="PILLBOX_USED_STATUS_FETCHED",
            i18n_key="api.shared_boxes.status_retrieved",
            data={"if_pillbox_used": if_pillbox_used},
            log_extra={"calendar_id": calendar_id}
        )

    except Exception as e:
        return error_response(
            message="Error retrieving Pillbox usage status",
            code="GET_PILLBOX_USED_STATUS_ERROR",
            i18n_key="api.shared_boxes.status_fetch_error",
            status_code=500,
            error=str(e),
            log_extra={"calendar_id": calendar_id}
        )
    

# Route pour utiliser le pillbox d'un calendrier partagé
@api.route("/shared/users/calendars/<calendar_id>/pillbox/used", methods=["POST"])
@measure_time()
@require_auth
@verify_calendar_share
@with_query_origin(default_origin="USE_PILLBOX")
def handle_use_shared_users_pillbox(calendar_id):
    try:

        payload = request.get_json(force=True)
        start_date = payload.get("startDate")

        if not start_date:
            start_date = datetime.now(timezone.utc).date()
        else:
            start_date = datetime.strptime(start_date, "%Y-%m-%d").date()

        if add_pillbox_uses(calendar_id, g.uid, start_date):
            result = use_pillbox(calendar_id, start_date)
            if not result:
                return warning_response(
                    message="error when using the pill organizer",
                    code="USE_PILLBOX_ERROR",
                    i18n_key="api.shared_boxes.use_error",
                    status_code=500,
                    log_extra={"calendar_id": calendar_id}
                )
            return success_response(
                message="pill organizer used successfully",
                code="PILLBOX_USED",
                i18n_key="api.shared_boxes.pillbox_used",
                log_extra={"calendar_id": calendar_id}
            )
        else:
            return warning_response(
                message="the pillbox has already been used this week",
                code="PILLBOX_ALREADY_USED_THIS_WEEK",
                i18n_key="api.shared_boxes.pillbox_already_used_week",
                status_code=400,
                log_extra={"calendar_id": calendar_id}
            )
    except Exception as e:
        return error_response(
            message="error when using the pill organizer",
            code="USE_PILLBOX_ERROR",
            i18n_key="api.shared_boxes.use_error",
            status_code=500,
            error=str(e),
            log_extra={"calendar_id": calendar_id}
        )
    
# Route pour annuler l'utilisation du pillbox d'un calendrier
@api.route("/shared/users/calendars/<calendar_id>/pillbox/uses/<use_id>", methods=["DELETE"])
@measure_time()
@require_auth
@verify_calendar_share
@with_query_origin(default_origin="CANCEL_PILLBOX_USE")
def handle_cancel_shared_users_pillbox_use(calendar_id, use_id):
    try:
        if delete_pillbox_use(calendar_id, use_id):
            return success_response(
                message="Pillbox usage cancelled",
                code="PILLBOX_USE_CANCELED",
                i18n_key="api.shared_boxes.usage_cancelled",
                log_extra={"calendar_id": calendar_id, "use_id": use_id}
            )
        else:
            return warning_response(
                message="Pillbox usage not found",
                code="PILLBOX_USE_NOT_FOUND",
                i18n_key="api.shared_boxes.usage_not_found",
                status_code=404,
                log_extra={"calendar_id": calendar_id, "use_id": use_id}
            )
    except Exception as e:
        return error_response(
            message="Error while canceling the use of the pillbox",
            code="CANCEL_PILLBOX_USE_ERROR",
            i18n_key="api.shared_boxes.usage_cancel_error",
            status_code=500,
            error=str(e),
            log_extra={"calendar_id": calendar_id, "use_id": use_id}
        )
    
# Route pour recuperer les usages de pillbox d'un calendrier
@api.route("/shared/users/calendars/<calendar_id>/pillbox/uses", methods=["GET"])
@measure_time()
@require_auth
@verify_calendar_share
@with_query_origin(default_origin="GET_PILLBOX_USES")
def handle_get_shared_users_pillbox_uses(calendar_id):
    try:
        pillbox_uses = get_pillbox_uses(calendar_id)
        return success_response(
            message="uses of the recovered pillbox",
            code="PILLBOX_USES_FETCHED",
            i18n_key="api.shared_boxes.usages_retrieved",
            data={"pillbox_uses": pillbox_uses},
            log_extra={"calendar_id": calendar_id, "uses_count": len(pillbox_uses)}
        )
    except Exception as e:
        return error_response(
            message="Error retrieving pillbox usage",
            code="GET_PILLBOX_USES_ERROR",
            i18n_key="api.shared_boxes.usages_fetch_error",
            status_code=500,
            error=str(e),
            log_extra={"calendar_id": calendar_id}
        )

# Route pour réapprovisionner une boite de médicaments
@api.route("/shared/users/calendars/<calendar_id>/boxes/<box_id>/restock", methods=["POST"])
@measure_time()
@require_auth
@verify_calendar_share
@with_query_origin(default_origin="BOX_RESTOCK")
def handle_shared_user_restock_box(calendar_id, box_id):
    try:

        if not restock_box(box_id, calendar_id):
            return warning_response(
                message="medicine box not found",
                code="MEDICINE_BOX_NOT_FOUND",
                i18n_key="api.shared_boxes.box_not_found",
                status_code=404,
                log_extra={"calendar_id": calendar_id, "box_id": box_id}
            )

        return success_response(
            message="medicine box refilled",
            code="MEDICINE_BOX_RESTOCKED",
            i18n_key="api.shared_boxes.refilled",
            data={"box_id": box_id},
            log_extra={"calendar_id": calendar_id, "box_id": box_id}
        )
    except Exception as e:
        return error_response(
            message="error during restocking of the medicine box",
            code="RESTOCK_MEDICINE_BOX_ERROR",
            i18n_key="api.shared_boxes.refill_error",
            status_code=500,
            error=str(e),
            log_extra={"calendar_id": calendar_id, "box_id": box_id}
        )
