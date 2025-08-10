from flask import g
from .. import api
from app.utils.auth import require_auth
from app.utils.responses import success_response, error_response
from app.db.connection import get_connection
from app.services.calendar import verify_calendar_share
from app.services.user import fetch_user
import time


@api.route("/shared/grouped", methods=["GET"])
@require_auth
def handle_grouped_shared():
    try:
        t_0 = time.time()
        uid = g.uid

        with get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute("SELECT id, name FROM calendars WHERE owner_uid = %s", (uid,))
                calendars = cursor.fetchall()
                calendar_ids = [cal["id"] for cal in calendars]

                grouped = {
                    cal["id"]: {
                        "calendar_name": cal["name"],
                        "users": [],
                        "invitation": [],
                        "tokens": []
                    }
                    for cal in calendars
                }

                cursor.execute(
                    "SELECT * FROM shared_calendars WHERE calendar_id = ANY(%s::uuid[])",
                    (calendar_ids,),
                )
                shared_users = cursor.fetchall()

                for shared in shared_users:
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

                cursor.execute(
                    "SELECT * FROM shared_tokens WHERE calendar_id = ANY(%s::uuid[])",
                    (calendar_ids,),
                )
                tokens = cursor.fetchall()

                for token in tokens:
                    cal_id = token["calendar_id"]
                    if cal_id in grouped:
                        grouped[cal_id]["tokens"].append(token)

                cursor.execute(
                    "SELECT * FROM invitations WHERE calendar_id = ANY(%s::uuid[])",
                    (calendar_ids,),
                )
                invitations = cursor.fetchall()

                for invitation in invitations:
                    cal_id = invitation["calendar_id"]
                    if cal_id in grouped:
                        grouped[cal_id]["invitation"].append(invitation)

        t_1 = time.time()
        return success_response(
            message="Données partagées groupées récupérées",
            code="SHARED_GROUPED_LOAD_SUCCESS",
            uid=uid,
            origin="SHARED_GROUPED_LOAD",
            data={"grouped": grouped},
            log_extra={"calendar_count": len(grouped), "time": t_1 - t_0},
        )

    except Exception as e:
        return error_response(
            message="Erreur lors du groupement des données partagées",
            code="SHARED_GROUPED_LOAD_ERROR",
            status_code=500,
            uid=g.uid,
            origin="SHARED_GROUPED_LOAD",
            error=str(e),
        )


__all__ = ["handle_grouped_shared"]

