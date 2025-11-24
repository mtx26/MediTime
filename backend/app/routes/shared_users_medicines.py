from flask import request, g
from app.utils.auth import require_auth
from . import api
from app.utils.responses import success_response, error_response, warning_response
from app.services.calendar import verify_calendar_share, add_pillbox_uses, get_if_pillbox_is_used, get_pillbox_uses, delete_pillbox_use
from app.services.medication import get_boxes, update_box, create_box, delete_box, restock_box
from app.services.medication import use_pillbox
from datetime import datetime, timezone
from app.utils.measure import measure_time
from app.utils import with_query_origin

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
            message="boites de médicaments récupérées",
            code="MEDICINE_BOXES_FETCHED",
            data={"boxes": boxes},
            log_extra={"calendar_id": calendar_id, "boxes_count": len(boxes)}
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
@api.route("/shared/users/calendars/<calendar_id>/boxes/<box_id>", methods=["DELETE"])
@measure_time()
@require_auth
@verify_calendar_share
@with_query_origin(default_origin="BOX_DELETE")
def handle_delete_shared_box(calendar_id, box_id):
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
                    message="erreur lors de l'utilisation du pilulier",
                    code="USE_PILLBOX_ERROR",
                    status_code=500,
                    log_extra={"calendar_id": calendar_id}
                )
            return success_response(
                message="pilulier utilisé avec succès",
                code="PILLBOX_USED",
                log_extra={"calendar_id": calendar_id}
            )
        else:
            return warning_response(
                message="le pilulier a déjà été utilisé cette semaine",
                code="PILLBOX_ALREADY_USED_THIS_WEEK",
                status_code=400,
                log_extra={"calendar_id": calendar_id}
            )
    except Exception as e:
        return error_response(
            message="erreur lors de l'utilisation du pilulier",
            code="USE_PILLBOX_ERROR",
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
        delete_pillbox_use(calendar_id, use_id)
        return success_response(
            message="utilisation du pillbox annulée",
            code="PILLBOX_USE_CANCELED",
            log_extra={"calendar_id": calendar_id, "use_id": use_id}
        )
    except Exception as e:
        return error_response(
            message="erreur lors de l'annulation de l'utilisation du pillbox",
            code="CANCEL_PILLBOX_USE_ERROR",
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
            message="usages du pilulier récupérés",
            code="PILLBOX_USES_FETCHED",
            data={"pillbox_uses": pillbox_uses},
            log_extra={"calendar_id": calendar_id, "uses_count": len(pillbox_uses)}
        )
    except Exception as e:
        return error_response(
            message="erreur lors de la récupération des usages du pilulier",
            code="GET_PILLBOX_USES_ERROR",
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
                message="boite de médicaments non trouvée",
                code="MEDICINE_BOX_NOT_FOUND",
                status_code=404,
                log_extra={"calendar_id": calendar_id, "box_id": box_id}
            )

        return success_response(
            message="boite de médicaments réapprovisionnée",
            code="MEDICINE_BOX_RESTOCKED",
            data={"box_id": box_id},
            log_extra={"calendar_id": calendar_id, "box_id": box_id}
        )
    except Exception as e:
        return error_response(
            message="erreur lors du réapprovisionnement de la boite de médicaments",
            code="RESTOCK_MEDICINE_BOX_ERROR",
            status_code=500,
            error=str(e),
            log_extra={"calendar_id": calendar_id, "box_id": box_id}
        )
