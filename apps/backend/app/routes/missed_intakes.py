from flask import request
from . import api
from app.services.medication import apply_missed_intakes, preview_missed_intakes
from app.utils.responses import success_response, error_response, warning_response
from app.utils.decorators import require_auth, verify_calendar, verify_calendar_share, measure_time, with_query_origin


def _validate_payload(calendar_id, prefix="api.missed_intakes"):
    """Valide le payload et retourne les champs ou une réponse d'erreur."""
    payload = request.get_json(force=True)

    mode = payload.get("mode")
    days = payload.get("days", [])
    times = payload.get("times")
    per_day_times = payload.get("per_day_times")
    med_ids = payload.get("med_ids")

    if mode not in ("intake", "medication"):
        return None, warning_response(
            message="Invalid mode",
            code="MISSED_INTAKES_INVALID_MODE",
            i18n_key=f"{prefix}.invalid_mode",
            status_code=400,
            log_extra={"calendar_id": calendar_id, "mode": mode}
        )

    if not days or not isinstance(days, list):
        return None, warning_response(
            message="No days selected",
            code="MISSED_INTAKES_NO_DAYS",
            i18n_key=f"{prefix}.no_days",
            status_code=400,
            log_extra={"calendar_id": calendar_id}
        )

    if mode == "intake" and not times and not per_day_times:
        return None, warning_response(
            message="No times selected",
            code="MISSED_INTAKES_NO_TIMES",
            i18n_key=f"{prefix}.no_times",
            status_code=400,
            log_extra={"calendar_id": calendar_id}
        )

    if mode == "medication" and (not med_ids or not isinstance(med_ids, list)):
        return None, warning_response(
            message="No medications selected",
            code="MISSED_INTAKES_NO_MEDS",
            i18n_key=f"{prefix}.no_meds",
            status_code=400,
            log_extra={"calendar_id": calendar_id}
        )

    return {"mode": mode, "days": days, "times": times, "per_day_times": per_day_times, "med_ids": med_ids}, None


def _validate_and_preview(calendar_id, prefix="api.missed_intakes"):
    """Logique commune de preview (personal + shared)."""
    params, err = _validate_payload(calendar_id, prefix)
    if err:
        return err

    result = preview_missed_intakes(
        calendar_id=calendar_id,
        mode=params["mode"],
        days=params["days"],
        times=params["times"],
        per_day_times=params["per_day_times"],
        med_ids=params["med_ids"],
    )

    return success_response(
        message="Missed intakes preview",
        code="MISSED_INTAKES_PREVIEW",
        i18n_key=f"{prefix}.preview",
        data=result,
    )


def _validate_and_apply(calendar_id, prefix="api.missed_intakes"):
    """Logique commune aux deux routes (personal + shared)."""
    params, err = _validate_payload(calendar_id, prefix)
    if err:
        return err

    result = apply_missed_intakes(
        calendar_id=calendar_id,
        mode=params["mode"],
        days=params["days"],
        times=params["times"],
        per_day_times=params["per_day_times"],
        med_ids=params["med_ids"],
    )

    return success_response(
        message="Missed intakes applied",
        code="MISSED_INTAKES_APPLIED",
        i18n_key=f"{prefix}.applied",
        data=result,
        log_extra={
            "calendar_id": calendar_id,
            "mode": params["mode"],
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


# ── Preview routes ────────────────────────────────────────────────────

@api.route("/calendars/<calendar_id>/missed-intakes/preview", methods=["POST"])
@measure_time()
@require_auth
@verify_calendar
@with_query_origin(default_origin="MISSED_INTAKES_PREVIEW")
def handle_missed_intakes_preview(calendar_id):
    try:
        return _validate_and_preview(calendar_id, prefix="api.missed_intakes")
    except Exception as e:
        return error_response(
            message="Error previewing missed intakes",
            code="MISSED_INTAKES_PREVIEW_ERROR",
            i18n_key="api.missed_intakes.error",
            status_code=500,
            error=str(e),
            log_extra={"calendar_id": calendar_id}
        )


@api.route("/shared/users/calendars/<calendar_id>/missed-intakes/preview", methods=["POST"])
@measure_time()
@require_auth
@verify_calendar_share
@with_query_origin(default_origin="SHARED_MISSED_INTAKES_PREVIEW")
def handle_shared_missed_intakes_preview(calendar_id):
    try:
        return _validate_and_preview(calendar_id, prefix="api.shared_missed_intakes")
    except Exception as e:
        return error_response(
            message="Error previewing shared missed intakes",
            code="SHARED_MISSED_INTAKES_PREVIEW_ERROR",
            i18n_key="api.shared_missed_intakes.error",
            status_code=500,
            error=str(e),
            log_extra={"calendar_id": calendar_id}
        )
