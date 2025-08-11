from flask import request, g
from app.utils.responses import success_response, error_response, warning_response
from app.utils.auth import require_auth
from app.db.connection import get_connection
from app.services.calendar import verify_calendar
from app.services.user import fetch_user
from app.services.notifications import notify_and_record
import time
from .. import api
from urllib.parse import urljoin
from app.config import Config
from app.services.notifications import email_address_direct
from psycopg2 import sql



# Messages d'erreur communs
ERROR_UNAUTHORIZED_ACCESS = "accès refusé"

# Route pour envoyer une invitation à un utilisateur pour un partage de calendrier
@api.route("/invitations/send/<calendar_id>", methods=["POST"])
@require_auth
def handle_send_invitation(calendar_id):
    try:
        t_0 = time.time()
        owner_uid = g.uid

        receiver_email = request.get_json(force=True).get("email")

        if not verify_calendar(calendar_id, owner_uid):
            return warning_response(
                message="calendrier non trouvé", 
                code="CALENDAR_NOT_FOUND", 
                status_code=404, 
                uid=owner_uid, 
                origin="INVITATION_SEND",
                log_extra={"calendar_id": calendar_id}
            )
        
        owner = fetch_user(owner_uid)

        with get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute("SELECT * FROM users WHERE email = %s", (receiver_email,))
                receiver_user = cursor.fetchone()

                if not receiver_user:
                    cursor.execute("""
                        INSERT INTO invitations (calendar_id, invited_email)
                        VALUES (%s, %s)
                        RETURNING token
                    """, (calendar_id, receiver_email))
                    token_raw = cursor.fetchone()
                    print(token_raw)
                    token = token_raw.get("token")

                    link = f"{Config.FRONTEND_URL}/accept-invite?token={token}&type=registration"

                    email_address_direct(
                        to_email=receiver_email,
                        notification_type="calendar_invitation_registration",
                        context={
                            "link": link,
                            "sender_uid": owner_uid,
                            "calendar_id": calendar_id,
                        }
                    )

                    return success_response(
                        message="invitation envoyée",
                        code="INVITATION_SEND_SUCCESS",
                        uid=owner_uid,
                        origin="INVITATION_SEND",
                        log_extra={"calendar_id": calendar_id}
                    )

                receiver_uid = receiver_user.get("id")

        # Verif si soit même
        if owner_uid == receiver_uid:
            return warning_response(
                message="invitation à soi-même", 
                code="SELF_INVITATION_ERROR", 
                status_code=400, 
                uid=owner_uid, 
                origin="INVITATION_SEND",
                log_extra={"calendar_id": calendar_id}
            )

        with get_connection() as conn:
            with conn.cursor() as cursor:  
                # Vérifier si l'utilisateur a déjà été invité
                cursor.execute("""
                    SELECT * 
                    FROM shared_calendars 
                    WHERE receiver_uid = %s AND calendar_id = %s
                """, (receiver_uid, calendar_id))

                shared_calendar = cursor.fetchone()

                if shared_calendar:
                    return warning_response(
                        message="utilisateur déjà invité",
                        code="ALREADY_INVITED",
                        status_code=400,
                        uid=owner_uid,
                        origin="INVITATION_SEND",
                        log_extra={"calendar_id": calendar_id}
                    )
                
                # Sauvegarder l'invitation dans la collection "shared_calendars" dans le calendrier de l'utilisateur owner
                cursor.execute(
                    """
                    INSERT INTO shared_calendars (receiver_uid, calendar_id, accepted, access)
                    VALUES (%s, %s, %s, %s)
                    RETURNING token
                    """,
                    (receiver_uid, calendar_id, False, "edit")
                )
                token = cursor.fetchone().get("token")

                link = urljoin(Config.FRONTEND_URL or "", f"/accept-invite?token={token}&type=invitation")

                # Créer une notif pour l'utilisateur receveur
                notify_and_record(
                    user_id=receiver_uid,
                    body_or_list={
                        "calendar_id": calendar_id,
                        "link": link,
                        "sender_uid": owner_uid
                    },
                    notification_type="calendar_invitation",
                )


                t_1 = time.time()

        return success_response(
            message="invitation envoyée", 
            code="INVITATION_SEND_SUCCESS", 
            uid=owner_uid, 
            origin="INVITATION_SEND",
            log_extra={"calendar_id": calendar_id, "time": t_1 - t_0}
        )

    except Exception as e:
        return error_response(
            message="erreur lors de l'envoi de l'invitation", 
            code="INVITATION_SEND_ERROR", 
            status_code=500, 
            uid=owner_uid, 
            origin="INVITATION_SEND",
            error=str(e),
            log_extra={"calendar_id": calendar_id}
        )


# Route pour accepter une invitation pour un partage de calendrier
@api.route("/invitations/accept/<notification_id>", methods=["POST"])
@require_auth
def handle_accept_invitation(notification_id):
    try:
        t_0 = time.time()
        receiver_uid = g.uid

        with get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute("SELECT * FROM notifications WHERE id = %s AND user_id = %s", (notification_id, receiver_uid))
                notification = cursor.fetchone()
                if notification is None:
                    return warning_response(
                        message="notification non trouvée", 
                        code="NOTIFICATION_NOT_FOUND", 
                        status_code=404, 
                        uid=receiver_uid, 
                        origin="INVITATION_ACCEPT",
                        log_extra={"notification_id": notification_id}
                    )
        
                # Vérifier si la notification est une invitation
                if notification.get("type") != "calendar_invitation":
                    return warning_response(
                        message="notification invalide", 
                        code="INVALID_NOTIFICATION", 
                        status_code=400, 
                        uid=receiver_uid, 
                        origin="INVITATION_ACCEPT",
                        log_extra={"notification_id": notification_id}
                    )
                
                calendar_id = notification.get("content").get("calendar_id")
                sender_uid = notification.get("sender_uid")
                link = urljoin(Config.FRONTEND_URL or "", f"/shared-calendars?calendar={calendar_id}")
                # Dire que l'utilisateur receveur a accepté l'invitation
                cursor.execute(
                    """
                    UPDATE shared_calendars SET accepted = TRUE, accepted_at = NOW() WHERE receiver_uid = %s AND calendar_id = %s
                    """,
                    (receiver_uid, calendar_id)
                )
                
                # Dire que la notif a été lue
                cursor.execute(
                    """
                    UPDATE notifications SET read = TRUE WHERE id = %s AND user_id = %s
                    """,
                    (notification_id, receiver_uid)
                )

                # Créer une notif pour l'utilisateur expéditeur
                notify_and_record(
                    user_id=sender_uid,
                    body_or_list={
                        "link": link,
                        "calendar_id": calendar_id,
                        "sender_uid": receiver_uid
                    },
                    notification_type="calendar_invitation_accepted",
                )

                t_1 = time.time()

        return success_response(
            message="invitation acceptée", 
            code="INVITATION_ACCEPT_SUCCESS", 
            uid=receiver_uid, 
            origin="INVITATION_ACCEPT",
            log_extra={"notification_id": notification_id, "time": t_1 - t_0}
        )

    except Exception as e:
        return error_response(
            message="erreur lors de l'acceptation de l'invitation", 
            code="INVITATION_ACCEPT_ERROR", 
            status_code=500, 
            uid=receiver_uid, 
            origin="INVITATION_ACCEPT",
            error=str(e),
            log_extra={"notification_id": notification_id}
        )


# Route pour rejeter une invitation pour un partage de calendrier
@api.route("/invitations/reject/<notification_id>", methods=["POST"])
@require_auth
def handle_reject_invitation(notification_id):
    try:
        t_0 = time.time()
        receiver_uid = g.uid

        with get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute("SELECT * FROM notifications WHERE id = %s AND user_id = %s", (notification_id, receiver_uid))
                notification = cursor.fetchone()
                if not notification:
                    return warning_response(
                        message="notification non trouvée", 
                        code="NOTIFICATION_NOT_FOUND", 
                        status_code=404, 
                        uid=receiver_uid, 
                        origin="INVITATION_REJECT",
                        log_extra={"notification_id": notification_id}
                    )

                # Vérifier si la notification est une invitation
                if notification.get("type") != "calendar_invitation":
                    return warning_response(
                        message="notification invalide", 
                        code="INVALID_NOTIFICATION", 
                        status_code=400, 
                        uid=receiver_uid, 
                        origin="INVITATION_REJECT",
                        log_extra={"notification_id": notification_id}
                    )

                calendar_id = notification.get("content").get("calendar_id")
                owner_uid = notification.get("sender_uid")
                link = urljoin(Config.FRONTEND_URL or "", f"/shared-calendars?calendar={calendar_id}")
                # Supprimer la notif
                cursor.execute(
                    """
                    DELETE FROM notifications WHERE id = %s AND user_id = %s
                    """,
                    (notification_id, receiver_uid)
                )
                # Créer une notif pour l'utilisateur expéditeur
                notify_and_record(
                    user_id=owner_uid,
                    body_or_list={
                        "link": link,
                        "calendar_id": calendar_id,
                        "sender_uid": receiver_uid
                    },
                    notification_type="calendar_invitation_rejected",
                )


                # Supprimer la notif dans la collection "shared_calendars" dans le calendrier de l'utilisateur owner
                cursor.execute(
                    """
                    DELETE FROM shared_calendars WHERE receiver_uid = %s AND calendar_id = %s
                    """,
                    (receiver_uid, calendar_id)
                )

                t_1 = time.time()

        return success_response(
            message="invitation rejetée", 
            code="INVITATION_REJECT_SUCCESS", 
            uid=receiver_uid, 
            origin="INVITATION_REJECT",
            log_extra={"notification_id": notification_id, "time": t_1 - t_0}
        )

    except Exception as e:
        return error_response(
            message="erreur lors du rejet de l'invitation",
            code="INVITATION_REJECT_ERROR",
            status_code=500,
            uid=receiver_uid,
            origin="INVITATION_REJECT",
            error=str(e),
            log_extra={"notification_id": notification_id}
        )


# fonction pour supprimer une invitation de calendrier partagé pour un user sans compte
def _parse_invitation_payload():
    data = request.get_json(force=True) or {}
    return data.get("token"), data.get("email")


def _remove_invitation(cursor, calendar_id, token, owner_uid, receiver_email):
    cursor.execute(
        sql.SQL("DELETE FROM invitations WHERE token = %s AND calendar_id = %s"),
        (token, calendar_id),
    )
    email_address_direct(
        to_email=receiver_email,
        notification_type="calendar_invitation_registration_deleted",
        context={"sender_uid": owner_uid, "calendar_id": calendar_id},
    )


@api.route("/invitations/<calendar_id>", methods=["DELETE"])
@require_auth
def delete_shared_calendar_invitation(calendar_id):
    try:
        t_0 = time.time()
        owner_uid = g.uid
        if not verify_calendar(calendar_id, owner_uid):
            return warning_response(
                message=ERROR_UNAUTHORIZED_ACCESS,
                code="UNAUTHORIZED_ACCESS",
                status_code=404,
                uid=owner_uid,
                origin="GET_MEDICINE_BOXES",
                log_extra={"calendar_id": calendar_id},
            )

        token, receiver_email = _parse_invitation_payload()
        if not token:
            return error_response(
                message="Token de l'utilisateur requis",
                code="MISSING_TOKEN",
                status_code=400,
                uid=owner_uid,
                origin="DELETE_SHARED_CALENDAR_INVITATION",
            )

        with get_connection() as conn, conn.cursor() as cursor:
            _remove_invitation(cursor, calendar_id, token, owner_uid, receiver_email)
            conn.commit()
            t_1 = time.time()

        return success_response(
            message="Invitation de calendrier supprimée",
            code="SHARED_CALENDAR_INVITATION_DELETE_SUCCESS",
            uid=receiver_email,
            origin="DELETE_SHARED_CALENDAR_INVITATION",
            log_extra={"calendar_id": calendar_id, "time": t_1 - t_0},
        )
    except Exception as e:
        return error_response(
            message="Erreur lors de la récupération des données partagées",
            code="SHARED_GROUPED_LOAD_ERROR",
            status_code=500,
            uid=owner_uid,
            origin="GET_SHARED_GROUPED",
            error=str(e),
        )

