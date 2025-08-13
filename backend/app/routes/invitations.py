from flask import request, g
from app.utils.responses import success_response, error_response, warning_response
from app.utils.auth import require_auth
from app.db.connection import get_connection
from app.services.calendar import verify_calendar, verify_login_invitation_owner, verify_registration_invitation_owner, verify_login_invitation_receiver
from app.services.notifications import notify_and_record
from . import api
from app.config import Config
from app.services.notifications import email_address_direct
from app.utils.measure import measure_time
import json


# Route pour envoyer une invitation à un utilisateur pour un partage de calendrier
@api.route("/invitations/<calendar_id>", methods=["POST"])
@measure_time()
@require_auth
@verify_calendar
def handle_send_invitation(calendar_id):
    try:
        owner_uid = g.uid
        payload = request.get_json(force=True)

        receiver_email = payload.get("email")

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

                    link = f"/accept-invite?token={token}&type=registration"

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
                    RETURNING token, id
                    """,
                    (receiver_uid, calendar_id, False, "edit")
                )
                raw = cursor.fetchone()
                token = raw.get("token")
                shared_calendar_id = raw.get("id")
                conn.commit()
                print(token, shared_calendar_id)

                link = f"/accept-invite?token={token}&type=login"

                # Créer une notif pour l'utilisateur receveur
                notify_and_record(
                    user_id=receiver_uid,
                    body_or_list={
                        "calendar_id": calendar_id,
                        "link": link,
                        "sender_uid": owner_uid,
                        "shared_calendar_id": shared_calendar_id
                    },
                    notification_type="calendar_invitation",
                )

        return success_response(
            message="invitation envoyée", 
            code="INVITATION_SEND_SUCCESS", 
            uid=owner_uid, 
            origin="INVITATION_SEND",
            log_extra={"calendar_id": calendar_id}
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

# Recupe pour une login
@api.route("/invitations/login/<token>", methods=["GET"])
@measure_time()
@require_auth
def handle_login_invitation(token):
    try:
        uid = g.uid

        with get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute("""
                    SELECT sc.*,
                        u.email AS owner_email,
                        u.photo_url AS owner_photo_url,
                        u.display_name AS owner_display_name,
                        c.name  AS calendar_name
                    FROM shared_calendars sc
                    JOIN calendars c ON sc.calendar_id = c.id
                    JOIN users u     ON c.owner_uid = u.id
                    WHERE sc.token = %s
                    AND sc.receiver_uid = %s
                    AND sc.accepted = FALSE
                """, (token, uid))
                invitation = cursor.fetchone()

                if not invitation:
                    return error_response(
                        message="invitation non trouvée",
                        code="INVITATION_LOGIN_NOT_FOUND",
                        uid=uid,
                        status_code=404,
                        origin="INVITATION_LOGIN"
                    )

                return success_response(
                    message="invitation acceptée",
                    code="INVITATION_LOGIN_ACCEPTED",
                    uid=uid,
                    origin="INVITATION_LOGIN",
                    data={ "invitation": invitation },
                    log_extra={"token": token}
                )

    except Exception as e:
        return error_response(
            message="Erreur lors de la récupération de l'invitation",
            code="INVITATION_LOGIN_FETCH_ERROR",
            status_code=500,
            uid=uid,
            origin="INVITATION_LOGIN",
            log_extra={"error": str(e)}
        )


# Route pour supprimer un utilisateur partagé pour le owner
@api.route("/invitations/login/<token>", methods=["DELETE"])
@measure_time()
@require_auth
@verify_login_invitation_owner
def delete_login_invitation(token):
    try:
        owner_uid = g.uid
        calendar_id = g.calendar_id
        receiver_uid = g.receiver_uid

        with get_connection() as conn:
            with conn.cursor() as cursor:

                cursor.execute("DELETE FROM shared_calendars WHERE token = %s", (token,))
                row = cursor.rowcount
                if row == 0:
                    return warning_response(
                        message="calendrier non trouvé",
                        code="SHARED_USERS_DELETE_ERROR",
                        status_code=404,
                        uid=owner_uid,
                        origin="SHARED_USERS_DELETE",
                        log_extra={"token": token}
                    )

                cursor.execute(
                    "DELETE FROM notifications WHERE user_id = %s AND type = %s AND content = %s::jsonb AND sender_uid = %s",
                    (
                        receiver_uid,
                        "calendar_invitation",
                        json.dumps({"calendar_id": calendar_id}),
                        owner_uid
                    )
                )       
                link = f"/calendar/{calendar_id}"

                notify_and_record(
                    user_id=receiver_uid,
                    body_or_list={
                        "link": link,
                        "calendar_id": calendar_id,
                        "sender_uid": owner_uid
                    },
                    notification_type="calendar_shared_deleted_by_owner",
                )

        return success_response(
            message="utilisateur partagé supprimé", 
            code="SHARED_USERS_DELETE_SUCCESS", 
            uid=receiver_uid, 
            origin="SHARED_USERS_DELETE",
            log_extra={"calendar_id": calendar_id}
        )

    except Exception as e:
        return error_response(
            message="erreur lors de la suppression de l'utilisateur partagé",
            code="SHARED_USERS_DELETE_ERROR", 
            status_code=500, 
            uid=receiver_uid, 
            origin="SHARED_USERS_DELETE",
            error=str(e),
            log_extra={"calendar_id": calendar_id}
        )


# Route pour accepter une invitation pour un partage de calendrier
@api.route("/invitations/login/accept/<token>", methods=["POST"])
@measure_time()
@require_auth
@verify_login_invitation_receiver
def handle_accept_login_invitation(token):
    try:
        uid = g.uid
        calendar_id = g.calendar_id
        owner_uid = g.owner_uid

        with get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute("""
                    UPDATE shared_calendars
                    SET accepted = TRUE,
                        accepted_at = NOW()
                    WHERE token = %s
                    AND receiver_uid = %s
                    AND accepted = FALSE
                """, (token, uid))


                link = f"/shared-calendars?calendar={calendar_id}"

                # Créer une notif pour l'utilisateur expéditeur
                notify_and_record(
                    user_id=owner_uid,
                    body_or_list={
                        "link": link,
                        "calendar_id": calendar_id,
                        "sender_uid": uid
                    },
                    notification_type="calendar_invitation_accepted",
                )

        return success_response(
            message="invitation acceptée", 
            code="INVITATION_ACCEPT_SUCCESS", 
            uid=uid, 
            origin="INVITATION_ACCEPT",
            data={"calendar_id": calendar_id},
            log_extra={"token": token}
        )

    except Exception as e:
        return error_response(
            message="erreur lors de l'acceptation de l'invitation", 
            code="INVITATION_ACCEPT_ERROR", 
            status_code=500, 
            uid=uid, 
            origin="INVITATION_ACCEPT",
            error=str(e),
            log_extra={"token": token}
        )


# Route pour rejeter une invitation pour un partage de calendrier
@api.route("/invitations/login/reject/<token>", methods=["POST"])
@measure_time()
@require_auth
@verify_login_invitation_receiver
def handle_reject_login_invitation(token):
    try:
        uid = g.uid
        calendar_id = g.calendar_id
        owner_uid = g.owner_uid

        with get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute(
                    """
                    DELETE FROM shared_calendars WHERE token = %s
                    """,
                    (token,)
                )

                link = f"/shared-calendars?calendar={calendar_id}"
                # Créer une notif pour l'utilisateur expéditeur
                notify_and_record(
                    user_id=owner_uid,
                    body_or_list={
                        "link": link,
                        "calendar_id": calendar_id,
                        "sender_uid": uid
                    },
                    notification_type="calendar_invitation_rejected",
                )

        return success_response(
            message="invitation rejetée", 
            code="INVITATION_REJECT_SUCCESS", 
            uid=uid, 
            origin="INVITATION_REJECT",
            log_extra={"token": token}
        )

    except Exception as e:
        return error_response(
            message="erreur lors du rejet de l'invitation", 
            code="INVITATION_REJECT_ERROR", 
            status_code=500, 
            uid=uid, 
            origin="INVITATION_REJECT",
            error=str(e),
            log_extra={"token": token}
        )

# Recupe pour une registration
@api.route("/invitations/registration/<token>", methods=["GET"])
@measure_time()
@require_auth
def handle_registration_invitation(token):
    try:
        uid = g.uid
        user = g.user
        email = user.get("email")

        with get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute("""
                    SELECT i.*,
                        c.name AS calendar_name,
                        u.email AS owner_email,
                        u.photo_url AS owner_photo_url,
                        u.display_name AS owner_display_name
                    FROM invitations i
                    JOIN calendars c ON i.calendar_id = c.id
                    JOIN users u     ON c.owner_uid = u.id
                    WHERE i.token = %s
                    AND i.invited_email = %s
                """, (token, email))
                invitation = cursor.fetchone()

                if not invitation:
                    return error_response(
                        message="invitation non trouvée",
                        code="INVITATION_NOT_FOUND",
                        uid=uid,
                        status_code=404,
                        origin="INVITATION_REGISTRATION"
                    )

                return success_response(
                    message="invitation trouvée",
                    code="INVITATION_FOUND",
                    uid=uid,
                    origin="INVITATION_REGISTRATION",
                    data={"invitation": invitation},
                    log_extra={"token": token}
                )

    except Exception as e:
        return error_response(
            message="Erreur lors de la récupération de l'invitation",
            code="INVITATION_FETCH_ERROR",
            uid=uid,
            origin="INVITATION_REGISTRATION",
            status_code=500,
            log_extra={"error": str(e)}
        )

# fonction pour supprimer une invitation de calendrier partagé pour un user sans compte
@api.route("/invitations/registration/<token>", methods=["DELETE"])
@measure_time()
@require_auth
@verify_registration_invitation_owner
def delete_registration_invitation(token):
    try:
        uid = g.uid
        calendar_id = g.calendar_id
        invited_email = g.invited_email

        with get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute("DELETE FROM invitations WHERE token = %s AND calendar_id = %s", (token, calendar_id))
                cursor.connection.commit()

                email_address_direct(
                    to_email=invited_email,
                    notification_type="calendar_invitation_registration_deleted",
                    context={
                        "sender_uid": uid,
                        "calendar_id": calendar_id,
                    }
                )

                return success_response(
                    message="Invitation de calendrier supprimée",
                    code="SHARED_CALENDAR_INVITATION_DELETE_SUCCESS",
                    uid=uid,
                    origin="DELETE_SHARED_CALENDAR_INVITATION",
                    log_extra={"calendar_id": calendar_id}
                )
    except Exception as e:
        return error_response(
            message="Erreur lors de la récupération des données partagées",
            code="SHARED_GROUPED_LOAD_ERROR",
            status_code=500,
            uid=uid,
            origin="GET_SHARED_GROUPED",
            error=str(e)
        )
    

# Fonction pour accepter une invitation
@api.route("/invitations/registration/accept/<token>", methods=["POST"])
@measure_time()
@require_auth
def accept_registration_invitation(token):
    try:
        uid = g.uid
        with get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute("""
                    DELETE FROM invitations i
                    USING calendars c
                    WHERE i.calendar_id = c.id
                    AND i.token = %s
                    RETURNING i.calendar_id, c.owner_uid
                """, (token,))
                row = cursor.fetchone()
                calendar_id = row.get("calendar_id")
                owner_uid = row.get("owner_uid")

                cursor.execute("""
                    INSERT INTO shared_calendars (
                        receiver_uid,
                        calendar_id,
                        accepted,
                        accepted_at
                    )
                    VALUES (%s, %s, TRUE, NOW())
                """, (uid, calendar_id))
                conn.commit()

                notify_and_record(
                    user_id=owner_uid,
                    body_or_list={
                        "calendar_id": calendar_id,
                        "link": f"/shared-calendars?calendar={calendar_id}",
                        "sender_uid": uid,
                    },
                    notification_type="calendar_invitation_accepted",
                )

                return success_response(
                    message="Invitation de calendrier acceptée",
                    code="SHARED_CALENDAR_INVITATION_ACCEPT_SUCCESS",
                    uid=uid,
                    origin="ACCEPT_SHARED_CALENDAR_INVITATION",
                    data={"calendar_id": calendar_id},
                    log_extra={"token": token}
                )
            
    except Exception as e:
        return error_response(
            message="Erreur lors de l'acceptation de l'invitation",
            code="SHARED_CALENDAR_INVITATION_ACCEPT_ERROR",
            status_code=500,
            uid=uid,
            origin="ACCEPT_SHARED_CALENDAR_INVITATION",
            error=str(e)
        )


# Fonction pour rejeter une invitation
@api.route("/invitations/registration/reject/<token>", methods=["POST"])
@measure_time()
@require_auth
def reject_registration_invitation(token):
    try:
        uid = g.uid
        with get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute("""
                    DELETE FROM invitations i
                    USING calendars c
                    WHERE i.calendar_id = c.id
                    AND i.token = %s
                    RETURNING i.calendar_id, c.owner_uid
                """, (token,))
                
                row = cursor.fetchone()
                calendar_id = row.get("calendar_id")
                owner_uid = row.get("owner_uid")

                conn.commit()

                link = f"/shared-calendars?calendar={calendar_id}"

                notify_and_record(
                    user_id=owner_uid,
                    body_or_list={
                        "calendar_id": calendar_id,
                        "link": link,
                        "sender_uid": uid,
                    },
                    notification_type="calendar_shared_deleted_by_receiver",
                )

                return success_response(
                    message="Invitation de calendrier acceptée",
                    code="SHARED_CALENDAR_INVITATION_ACCEPT_SUCCESS",
                    uid=uid,
                    origin="ACCEPT_SHARED_CALENDAR_INVITATION",
                    log_extra={"token": token}
                )
    except Exception as e:
        return error_response(
            message="Erreur lors de l'acceptation de l'invitation",
            code="SHARED_CALENDAR_INVITATION_ACCEPT_ERROR",
            status_code=500,
            uid=uid,
            origin="ACCEPT_SHARED_CALENDAR_INVITATION",
            error=str(e)
        )