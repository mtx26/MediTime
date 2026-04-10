from flask import request
from . import api
from app.services.medication import apply_missed_intakes
from app.utils.responses import success_response, error_response, warning_response
from app.utils.decorators import require_auth, verify_calendar, verify_calendar_share, measure_time, with_query_origin


def _validate_and_apply(calendar_id, prefix="api.missed_intakes"):
    """Logique commune aux deux routes (personal + shared)."""
    payload = request.get_json(force=True)

    mode = payload.get("mode")
    days = payload.get("days", [])
    times = payload.get("times")
    per_day_times = payload.get("per_day_times")
    med_ids = payload.get("med_ids")

    if mode not in ("intake", "medication"):
        return warning_response(
            message="Invalid mode",
            code="MISSED_INTAKES_INVALID_MODE",
            i18n_key=f"{prefix}.invalid_mode",
            status_code=400,
            log_extra={"calendar_id": calendar_id, "mode": mode}
        )

    if not days or not isinstance(days, list):
        return warning_response(
            message="No days selected",
            code="MISSED_INTAKES_NO_DAYS",
            i18n_key=f"{prefix}.no_days",
            status_code=400,
            log_extra={"calendar_id": calendar_id}
        )

    if mode == "intake" and not times and not per_day_times:
        return warning_response(
            message="No times selected",
            code="MISSED_INTAKES_NO_TIMES",
            i18n_key=f"{prefix}.no_times",
            status_code=400,
            log_extra={"calendar_id": calendar_id}
        )

    if mode == "medication" and (not med_ids or not isinstance(med_ids, list)):
        return warning_response(
            message="No medications selected",
            code="MISSED_INTAKES_NO_MEDS",
            i18n_key=f"{prefix}.no_meds",
            status_code=400,
            log_extra={"calendar_id": calendar_id}
        )

    result = apply_missed_intakes(
        calendar_id=calendar_id,
        mode=mode,
        days=days,
        times=times,
        per_day_times=per_day_times,
        med_ids=med_ids,
    )

    return success_response(
        message="Missed intakes applied",
        code="MISSED_INTAKES_APPLIED",
        i18n_key=f"{prefix}.applied",
        data=result,
        log_extra={
            "calendar_id": calendar_id,
            "mode": mode,
            "total_tablets_added": result.get("total_tablets_added", 0),
        }
    )


# Route personnelle
@api.route("/calendars/<calendar_id>/missed-intakes", methods=["POST"])
@measure_time()
@require_auth
@verify_calendar
@with_query_origin(default_origin="MISSED_INTAKES")
def handle_missed_intakes(calendar_id):
    try:
        return _validate_and_apply(calendar_id, prefix="api.missed_intakes")
    except Exception as e:
        return error_response(
            message="Error applying missed intakes",
            code="MISSED_INTAKES_ERROR",
            i18n_key="api.missed_intakes.error",
            status_code=500,
            error=str(e),
            log_extra={"calendar_id": calendar_id}
        )


# Route partagée
@api.route("/shared/users/calendars/<calendar_id>/missed-intakes", methods=["POST"])
@measure_time()
@require_auth
@verify_calendar_share
@with_query_origin(default_origin="SHARED_MISSED_INTAKES")
def handle_shared_missed_intakes(calendar_id):
    try:
        return _validate_and_apply(calendar_id, prefix="api.shared_missed_intakes")
    except Exception as e:
        return error_response(
            message="Error applying shared missed intakes",
            code="SHARED_MISSED_INTAKES_ERROR",
            i18n_key="api.shared_missed_intakes.error",
            status_code=500,
            error=str(e),
            log_extra={"calendar_id": calendar_id}
        )
