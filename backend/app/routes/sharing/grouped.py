from flask import g
from .. import api
from app.utils.auth import require_auth
from app.utils.responses import success_response, error_response
from app.db.connection import get_connection
from app.services.calendar import verify_calendar_share
from app.services.user import fetch_user
import time


def _fetch_owned_calendars(cursor, uid):
    cursor.execute("SELECT id, name FROM calendars WHERE owner_uid = %s", (uid,))
    calendars = cursor.fetchall()
    return {
        cal["id"]: {
            "calendar_name": cal["name"],
            "users": [],
            "invitation": [],
            "tokens": [],
        }
        for cal in calendars
    }


def _append_shared_users(cursor, calendar_ids, grouped):
    cursor.execute(
        "SELECT * FROM shared_calendars WHERE calendar_id = ANY(%s::uuid[])",
        (calendar_ids,),
    )
    for shared in cursor.fetchall():
        calendar_id = shared["calendar_id"]
        receiver_uid = shared["receiver_uid"]
        if not verify_calendar_share(calendar_id, receiver_uid):
            continue
        receiver = fetch_user(receiver_uid)
        if not receiver:
            continue
        user_info = {
            "receiver_uid": receiver_uid,
            "access": shared.get("access", "read"),
            "accepted": shared.get("accepted", False),
            "receiver_photo_url": receiver.get("photo_url")
            or "https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/icons/person-circle.svg",
            "receiver_name": receiver.get("display_name"),
            "receiver_email": receiver.get("email"),
        }
        if calendar_id in grouped:
            grouped[calendar_id]["users"].append(user_info)


def _append_tokens(cursor, calendar_ids, grouped):
    cursor.execute(
        "SELECT * FROM shared_tokens WHERE calendar_id = ANY(%s::uuid[])",
        (calendar_ids,),
    )
    for token in cursor.fetchall():
        cal_id = token["calendar_id"]
        if cal_id in grouped:
            grouped[cal_id]["tokens"].append(token)


def _append_invitations(cursor, calendar_ids, grouped):
    cursor.execute(
        "SELECT * FROM invitations WHERE calendar_id = ANY(%s::uuid[])",
        (calendar_ids,),
    )
    for invitation in cursor.fetchall():
        cal_id = invitation["calendar_id"]
        if cal_id in grouped:
            grouped[cal_id]["invitation"].append(invitation)


@api.route("/shared/grouped", methods=["GET"])
@require_auth
def handle_grouped_shared():
    try:
        t_0 = time.time()
        uid = g.uid
        with get_connection() as conn, conn.cursor() as cursor:
            grouped = _fetch_owned_calendars(cursor, uid)
            calendar_ids = list(grouped.keys())
            if calendar_ids:
                _append_shared_users(cursor, calendar_ids, grouped)
                _append_tokens(cursor, calendar_ids, grouped)
                _append_invitations(cursor, calendar_ids, grouped)
        t_1 = time.time()
        return success_response(
            message="Données partagées groupées récupérées",
            code="SHARED_GROUPED_LOAD_SUCCESS",
            uid=uid,
            origin="SHARED_GROUPED_LOAD",
            data={"grouped": grouped},
            log_extra={"calendar_count": len(grouped), "time": t_1 - t_0},
        )
    except Exception as e:  # pragma: no cover - defensive
        return error_response(
            message="Erreur lors du groupement des données partagées",
            code="SHARED_GROUPED_LOAD_ERROR",
            status_code=500,
            uid=g.uid,
            origin="SHARED_GROUPED_LOAD",
            error=str(e),
        )


__all__ = ["handle_grouped_shared"]

