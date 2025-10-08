from flask import request, g
from app.utils.responses import success_response, error_response, warning_response
from app.utils.auth import require_auth
from app.db.connection import get_connection
from app.services.calendar import (
    verify_calendar,
    verify_login_invitation_owner,
    verify_registration_invitation_owner,
    verify_login_invitation_receiver,
)
from app.services.notifications import notify_and_record
from . import api
from app.services.notifications import email_address_direct
from app.utils.measure import measure_time
import json
from app.utils import with_query_origin

# ---------------------------
# Helpers communs (DB & notifs)
# ---------------------------

def _get_user_by_email(cursor, email: str):
    cursor.execute("SELECT * FROM users WHERE email = %s", (email,))
    return cursor.fetchone()


def _insert_registration_invitation(cursor, calendar_id: str, email: str):
    cursor.execute(
        """
        INSERT INTO invitations (calendar_id, invited_email)
        VALUES (%s, %s)
        RETURNING token
        """,
        (calendar_id, email),
    )
    row = cursor.fetchone()
    return row.get("token") if row else None


def _create_shared_calendar_invite(cursor, receiver_uid: str, calendar_id: str):
    cursor.execute(
        """
        INSERT INTO shared_calendars (receiver_uid, calendar_id, accepted, access)
        VALUES (%s, %s, %s, %s)
        RETURNING token, id
        """,
        (receiver_uid, calendar_id, False, "edit"),
    )
    row = cursor.fetchone()
    return (row.get("token"), row.get("id")) if row else (None, None)


def _delete_shared_calendar_by_token(cursor, token: str) -> bool:
    cursor.execute(
        "DELETE FROM shared_calendars WHERE token = %s RETURNING 1",
        (token,),
    )
    return cursor.fetchone() is not None


def _delete_invitation_returning_calendar_owner(cursor, token: str):
    cursor.execute(
        """
        DELETE FROM invitations i
        USING calendars c
        WHERE i.calendar_id = c.id
          AND i.token = %s
        RETURNING i.calendar_id, c.owner_uid
        """,
        (token,),
    )
    row = cursor.fetchone()
    if not row:
        return (None, None)
    return (row.get("calendar_id"), row.get("owner_uid"))


def _delete_invite_notification(cursor, receiver_uid: str, calendar_id: str, owner_uid: str):
    # On supprime la notif d’invitation liée à ce calendrier (contenu contient au moins calendar_id)
    cursor.execute(
        """
        DELETE FROM notifications
        WHERE user_id = %s
          AND type = %s
          AND calendar_id = %s
          AND sender_uid = %s
        """,
        (receiver_uid, "calendar_invitation", calendar_id, owner_uid),
    )


# ---------------------------------------------
# Route : envoyer une invitation pour un partage
# ---------------------------------------------
@api.route("/invitations/<calendar_id>", methods=["POST"])
@measure_time()
@require_auth
@verify_calendar
@with_query_origin(default_origin="INVITATION_SEND")
def handle_send_invitation(calendar_id):
    owner_uid = g.uid if hasattr(g, "uid") else None  # défini avant try pour except éventuel
    try:
        payload = request.get_json(force=True)
        receiver_email = payload.get("email")

        with get_connection() as conn:
            with conn.cursor() as cursor:
                receiver_user = _get_user_by_email(cursor, receiver_email)

                # Pas d'utilisateur : invitation par email (registration flow)
                if not receiver_user:
                    token = _insert_registration_invitation(cursor, calendar_id, receiver_email)
                    link = f"/accept-invite?token={token}&type=registration"

                    email_address_direct(
                        to_email=receiver_email,
                        notification_type="calendar_invitation_registration",
                        context={
                            "link": link,
                            "sender_uid": owner_uid,
                            "calendar_id": calendar_id,
                        },
                    )

                    return success_response(
                        message="invitation envoyée",
                        code="INVITATION_SEND_SUCCESS",
                        log_extra={"calendar_id": calendar_id},
                    )

                # Utilisateur existant : flow login (shared_calendars + notif)
                receiver_uid = receiver_user.get("id")

        # Invitation à soi-même
        if owner_uid == receiver_uid:
            return warning_response(
                message="invitation à soi-même",
                code="SELF_INVITATION_ERROR",
                status_code=400,
                log_extra={"calendar_id": calendar_id},
            )

        with get_connection() as conn:
            with conn.cursor() as cursor:
                # Déjà invité ?
                cursor.execute(
                    """
                    SELECT 1
                    FROM shared_calendars
                    WHERE receiver_uid = %s AND calendar_id = %s
                    """,
                    (receiver_uid, calendar_id),
                )
                if cursor.fetchone():
                    return warning_response(
                        message="utilisateur déjà invité",
                        code="ALREADY_INVITED",
                        status_code=400,
                        log_extra={"calendar_id": calendar_id},
                    )

                # Créer l'invitation (shared_calendars)
                token, shared_calendar_id = _create_shared_calendar_invite(cursor, receiver_uid, calendar_id)
                conn.commit()

        link = f"/accept-invite?token={token}&type=login"

        # Notifier le receveur
        notify_and_record(
            user_id=receiver_uid,
            body_or_list={
                "calendar_id": calendar_id,
                "link": link,
                "sender_uid": owner_uid,
                "shared_calendar_id": shared_calendar_id,
            },
            notification_type="calendar_invitation",
        )

        return success_response(
            message="invitation envoyée",
            code="INVITATION_SEND_SUCCESS",
            log_extra={"calendar_id": calendar_id},
        )

    except Exception as e:
        return error_response(
            message="erreur lors de l'envoi de l'invitation",
            code="INVITATION_SEND_ERROR",
            status_code=500,
            error=str(e),
            log_extra={"calendar_id": calendar_id},
        )


# --------------------------------
# Récupération d'une login-invite
# --------------------------------
@api.route("/invitations/login/<token>", methods=["GET"])
@measure_time()
@require_auth
@with_query_origin(default_origin="GET_INVITATION_LOGIN")
def handle_login_invitation(token):
    uid = g.uid if hasattr(g, "uid") else None
    try:
        with get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute(
                    """
                    SELECT sc.*,
                           u.email        AS owner_email,
                           u.photo_url    AS owner_photo_url,
                           u.display_name AS owner_display_name,
                           c.name         AS calendar_name
                    FROM shared_calendars sc
                    JOIN calendars c ON sc.calendar_id = c.id
                    JOIN users u     ON c.owner_uid = u.id
                    WHERE sc.token = %s
                      AND sc.receiver_uid = %s
                      AND sc.accepted = FALSE
                    """,
                    (token, uid),
                )
                invitation = cursor.fetchone()

                if not invitation:
                    return error_response(
                        message="invitation non trouvée",
                        code="INVITATION_LOGIN_NOT_FOUND",
                        status_code=404,
                    )

                return success_response(
                    message="invitation trouvée",
                    code="INVITATION_LOGIN_FOUND",
                    data={"invitation": invitation},
                    log_extra={"token": token},
                )

    except Exception as e:
        return error_response(
            message="Erreur lors de la récupération de l'invitation",
            code="INVITATION_LOGIN_FETCH_ERROR",
            status_code=500,
            log_extra={"error": str(e)},
        )


# --------------------------------------------------------
# Suppression d'un utilisateur partagé (par le propriétaire)
# --------------------------------------------------------
@api.route("/invitations/login/<token>", methods=["DELETE"])
@measure_time()
@require_auth
@verify_login_invitation_owner
@with_query_origin(default_origin="DELETE_INVITATION_LOGIN")
def delete_login_invitation(token):
    owner_uid = g.uid if hasattr(g, "uid") else None
    calendar_id = g.calendar_id if hasattr(g, "calendar_id") else None
    receiver_uid = g.receiver_uid if hasattr(g, "receiver_uid") else None
    try:
        with get_connection() as conn:
            with conn.cursor() as cursor:
                deleted = _delete_shared_calendar_by_token(cursor, token)
                if not deleted:
                    return warning_response(
                        message="calendrier non trouvé",
                        code="SHARED_USERS_DELETE_ERROR",
                        status_code=404,
                        log_extra={"token": token},
                    )

                # Supprimer la notif d'invitation côté receveur
                _delete_invite_notification(cursor, receiver_uid, calendar_id, owner_uid)
                conn.commit()

        # Notifier le receveur que le partage a été retiré
        link = f"/calendar/{calendar_id}"
        notify_and_record(
            user_id=receiver_uid,
            body_or_list={
                "link": link,
                "calendar_id": calendar_id,
                "sender_uid": owner_uid,
            },
            notification_type="calendar_shared_deleted_by_owner",
        )

        return success_response(
            message="utilisateur partagé supprimé",
            code="SHARED_USERS_DELETE_SUCCESS",
            log_extra={"calendar_id": calendar_id},
        )

    except Exception as e:
        return error_response(
            message="erreur lors de la suppression de l'utilisateur partagé",
            code="SHARED_USERS_DELETE_ERROR",
            status_code=500,
            error=str(e),
            log_extra={"calendar_id": calendar_id},
        )


# ---------------------------------------------
# Acceptation d'une login-invite (par le receveur)
# ---------------------------------------------
@api.route("/invitations/login/accept/<token>", methods=["POST"])
@measure_time()
@require_auth
@verify_login_invitation_receiver
@with_query_origin(default_origin="INVITATION_LOGIN_ACCEPT")
def handle_accept_login_invitation(token):
    uid = g.uid if hasattr(g, "uid") else None
    calendar_id = g.calendar_id if hasattr(g, "calendar_id") else None
    owner_uid = g.owner_uid if hasattr(g, "owner_uid") else None
    try:
        with get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute(
                    """
                    UPDATE shared_calendars
                    SET accepted = TRUE,
                        accepted_at = NOW()
                    WHERE token = %s
                      AND receiver_uid = %s
                      AND accepted = FALSE
                    """,
                    (token, uid),
                )
                conn.commit()

        link = f"/shared-calendars?calendar={calendar_id}"

        # Notifier le propriétaire
        notify_and_record(
            user_id=owner_uid,
            body_or_list={
                "link": link,
                "calendar_id": calendar_id,
                "sender_uid": uid,
            },
            notification_type="calendar_invitation_accepted",
        )

        return success_response(
            message="invitation acceptée",
            code="INVITATION_ACCEPT_SUCCESS",
            data={"calendar_id": calendar_id},
            log_extra={"token": token},
        )

    except Exception as e:
        return error_response(
            message="erreur lors de l'acceptation de l'invitation",
            code="INVITATION_ACCEPT_ERROR",
            status_code=500,
            error=str(e),
            log_extra={"token": token},
        )


# ---------------------------------------------
# Rejet d'une login-invite (par le receveur)
# ---------------------------------------------
@api.route("/invitations/login/reject/<token>", methods=["POST"])
@measure_time()
@require_auth
@verify_login_invitation_receiver
@with_query_origin(default_origin="INVITATION_LOGIN_REJECT")
def handle_reject_login_invitation(token):
    uid = g.uid if hasattr(g, "uid") else None
    calendar_id = g.calendar_id if hasattr(g, "calendar_id") else None
    owner_uid = g.owner_uid if hasattr(g, "owner_uid") else None
    try:
        with get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute(
                    "DELETE FROM shared_calendars WHERE token = %s",
                    (token,),
                )
                conn.commit()

        link = f"/shared-calendars?calendar={calendar_id}"

        # Notifier le propriétaire
        notify_and_record(
            user_id=owner_uid,
            body_or_list={
                "link": link,
                "calendar_id": calendar_id,
                "sender_uid": uid,
            },
            notification_type="calendar_invitation_rejected",
        )

        return success_response(
            message="invitation rejetée",
            code="INVITATION_REJECT_SUCCESS",
            log_extra={"token": token},
        )

    except Exception as e:
        return error_response(
            message="erreur lors du rejet de l'invitation",
            code="INVITATION_REJECT_ERROR",
            status_code=500,
            error=str(e),
            log_extra={"token": token},
        )


# --------------------------------
# Récupération d'une registration
# --------------------------------
@api.route("/invitations/registration/<token>", methods=["GET"])
@measure_time()
@require_auth
@with_query_origin(default_origin="GET_INVITATION_REGISTRATION")
def handle_registration_invitation(token):
    try:
        user = g.user
        email = user.get("email")

        with get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute(
                    """
                    SELECT i.*,
                           c.name         AS calendar_name,
                           u.email        AS owner_email,
                           u.photo_url    AS owner_photo_url,
                           u.display_name AS owner_display_name
                    FROM invitations i
                    JOIN calendars c ON i.calendar_id = c.id
                    JOIN users u     ON c.owner_uid = u.id
                    WHERE i.token = %s
                        AND LOWER(i.invited_email) = LOWER(%s)
                    """,
                    (token, email),
                )
                invitation = cursor.fetchone()

                if not invitation:
                    return error_response(
                        message="invitation non trouvée",
                        code="INVITATION_NOT_FOUND",
                        status_code=404,
                    )

                return success_response(
                    message="invitation trouvée",
                    code="INVITATION_FOUND",
                    data={"invitation": invitation},
                    log_extra={"token": token},
                )

    except Exception as e:
        return error_response(
            message="Erreur lors de la récupération de l'invitation",
            code="INVITATION_FETCH_ERROR",
            status_code=500,
            log_extra={"error": str(e)},
        )


# -------------------------------------------------------------
# Suppression d'une registration-invite (par le propriétaire)
# -------------------------------------------------------------
@api.route("/invitations/registration/<token>", methods=["DELETE"])
@measure_time()
@require_auth
@verify_registration_invitation_owner
@with_query_origin(default_origin="DELETE_INVITATION_REGISTRATION")
def delete_registration_invitation(token):
    uid = g.uid if hasattr(g, "uid") else None
    calendar_id = g.calendar_id if hasattr(g, "calendar_id") else None
    invited_email = g.invited_email if hasattr(g, "invited_email") else None
    try:
        with get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute(
                    "DELETE FROM invitations WHERE token = %s AND calendar_id = %s",
                    (token, calendar_id),
                )
                conn.commit()

        # Email d'information au destinataire
        email_address_direct(
            to_email=invited_email,
            notification_type="calendar_invitation_registration_deleted",
            context={
                "sender_uid": uid,
                "calendar_id": calendar_id,
            },
        )

        return success_response(
            message="Invitation de calendrier supprimée",
            code="SHARED_CALENDAR_INVITATION_DELETE_SUCCESS",
            log_extra={"calendar_id": calendar_id},
        )

    except Exception as e:
        return error_response(
            message="Erreur lors de la suppression de l'invitation",
            code="SHARED_CALENDAR_INVITATION_DELETE_ERROR",
            status_code=500,
            error=str(e),
        )


# -----------------------------------
# Acceptation d'une registration
# -----------------------------------
@api.route("/invitations/registration/accept/<token>", methods=["POST"])
@measure_time()
@require_auth
@with_query_origin(default_origin="ACCEPT_INVITATION_REGISTRATION")
def accept_registration_invitation(token):
    uid = g.uid if hasattr(g, "uid") else None
    try:
        with get_connection() as conn:
            with conn.cursor() as cursor:
                calendar_id, owner_uid = _delete_invitation_returning_calendar_owner(cursor, token)
                if not calendar_id or not owner_uid:
                    return error_response(
                        message="invitation introuvable",
                        code="INVITATION_NOT_FOUND",
                        status_code=404,
                        log_extra={"token": token},
                    )

                cursor.execute(
                    """
                    INSERT INTO shared_calendars (
                        receiver_uid,
                        calendar_id,
                        accepted,
                        accepted_at
                    )
                    VALUES (%s, %s, TRUE, NOW())
                    """,
                    (uid, calendar_id),
                )
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
            data={"calendar_id": calendar_id},
            log_extra={"token": token},
        )

    except Exception as e:
        return error_response(
            message="Erreur lors de l'acceptation de l'invitation",
            code="SHARED_CALENDAR_INVITATION_ACCEPT_ERROR",
            status_code=500,
            error=str(e),
        )


# -----------------------------------
# Rejet d'une registration
# -----------------------------------
@api.route("/invitations/registration/reject/<token>", methods=["POST"])
@measure_time()
@require_auth
@with_query_origin(default_origin="REJECT_INVITATION_REGISTRATION")
def reject_registration_invitation(token):
    uid = g.uid if hasattr(g, "uid") else None
    try:
        with get_connection() as conn:
            with conn.cursor() as cursor:
                calendar_id, owner_uid = _delete_invitation_returning_calendar_owner(cursor, token)
                if not calendar_id or not owner_uid:
                    return error_response(
                        message="invitation introuvable",
                        code="INVITATION_NOT_FOUND",
                        status_code=404,
                        log_extra={"token": token},
                    )

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
            message="Invitation de calendrier rejetée",
            code="SHARED_CALENDAR_INVITATION_REJECT_SUCCESS",
            log_extra={"token": token},
        )

    except Exception as e:
        return error_response(
            message="Erreur lors du rejet de l'invitation",
            code="SHARED_CALENDAR_INVITATION_REJECT_ERROR",
            status_code=500,
            error=str(e),
        )
