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


def _get_user_by_email(cursor, email: str) -> dict | None:
    """Récupère un utilisateur par son email.

    Paramètres:
    - cursor: Curseur de la base de données.
    - email: Adresse email de l'utilisateur à récupérer.

    Retour:
    - dict ou None: Dictionnaire contenant les informations de l'utilisateur si trouvé, sinon None.
    """
    # Utilisation de la fonction RPC sécurisée pour contourner RLS
    cursor.execute("SELECT * FROM get_user_by_email(%s)", (email,))
    return cursor.fetchone()


def _insert_registration_invitation(cursor, calendar_id: str, email: str) -> str | None:
    """Insère une invitation d'enregistrement dans la base de données.

    Paramètres:
    - cursor: Curseur de la base de données.
    - calendar_id: ID du calendrier à partager.
    - email: Adresse email de l'invité.

    Retour:
    - str: Token de l'invitation créée.
    """

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


def _create_shared_calendar_invite(cursor, receiver_uid: str, calendar_id: str) -> tuple[str | None, int | None]:
    """Crée une invitation de partage de calendrier dans la base de données.
    
    Paramètres:
    - cursor: Curseur de la base de données.
    - receiver_uid: ID de l'utilisateur receveur de l'invitation.
    - calendar_id: ID du calendrier à partager.

    Retour:
    - tuple: (token de l'invitation, ID de l'invitation créée).
    """
    cursor.execute(
        """
        INSERT INTO shared_calendars (receiver_uid, calendar_id, access)
        VALUES (%s, %s, %s)
        RETURNING token, id
        """,
        (receiver_uid, calendar_id, "edit"),
    )
    row = cursor.fetchone()
    return (row.get("token"), row.get("id")) if row else (None, None)


def _delete_shared_calendar_by_token(cursor, token: str):
    """Supprime une invitation de partage de calendrier par son token.

    Paramètres:
    - cursor: Curseur de la base de données.
    - token: Token de l'invitation à supprimer.
    """
    print(token)

    cursor.execute(
        """
        UPDATE shared_calendars
        SET deleted_at = NOW()
        WHERE token = %s
            AND deleted_at IS NULL
            AND accepted_at IS NULL
        """,
        (token,),
    )


def _delete_invitation_returning_calendar_owner(cursor, token: str) -> tuple[str | None, str | None]:
    """Supprime une invitation d'enregistrement par son token et retourne l'ID du calendrier et du propriétaire.

    Paramètres:
    - cursor: Curseur de la base de données.
    - token: Token de l'invitation à supprimer.

    Retour:
    - tuple: (ID du calendrier, ID du propriétaire) si l'invitation a été trouvée et supprimée, sinon (None, None).
    """

    cursor.execute(
                """
                UPDATE invitations i
                SET deleted_at = COALESCE(deleted_at, NOW())
                FROM calendars c
                WHERE i.calendar_id = c.id
                    AND i.token = %s
                    AND i.deleted_at IS NULL
                RETURNING i.calendar_id, c.owner_uid
                """,
                (token,),
        )
    row = cursor.fetchone()
    if not row:
        return (None, None)
    return (row.get("calendar_id"), row.get("owner_uid"))


def _delete_invite_notification(cursor, receiver_uid: str, calendar_id: str, owner_uid: str):
    """Supprime la notification d'invitation de calendrier pour un utilisateur.

    Paramètres:
    - cursor: Curseur de la base de données.
    - receiver_uid: ID de l'utilisateur receveur de la notification.
    - calendar_id: ID du calendrier lié à la notification.
    - owner_uid: ID de l'utilisateur qui a envoyé l'invitation.
    """
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


def _handle_registration_invite(cursor, calendar_id : str, receiver_email: str, owner_uid: str):
    """
    Gère l'invitation pour un utilisateur non enregistré.
    
    Paramètres:
    - cursor: Curseur de la base de données.
    - calendar_id: ID du calendrier à partager.
    - receiver_email: Email de l'utilisateur à inviter.
    - owner_uid: ID de l'utilisateur qui envoie l'invitation.
    """
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

def _handle_existing_user_invite(cursor, calendar_id: str, receiver_uid: str, owner_uid: str):
    """
    Gère l'invitation pour un utilisateur existant.

    Paramètres:
    - cursor: Curseur de la base de données.
    - calendar_id: ID du calendrier à partager.
    - receiver_uid: ID de l'utilisateur à inviter.
    - owner_uid: ID de l'utilisateur qui envoie l'invitation.
    """
    # Invitation à soi-même
    if owner_uid == receiver_uid:
        return warning_response(
            message="invitation à soi-même",
            code="SELF_INVITATION_ERROR",
            status_code=400,
            log_extra={"calendar_id": calendar_id},
        )

        # Déjà invité ?
        cursor.execute(
                """
                SELECT 1
                FROM shared_calendars
                WHERE receiver_uid = %s AND calendar_id = %s
                    AND accepted_at IS NULL
                    AND deleted_at IS NULL
                LIMIT 1
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

    # Commit pour rendre le shared_calendar visible pour notify_and_record (qui utilise une nouvelle connexion)
    cursor.connection.commit()

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

@api.route("/invitations/<calendar_id>", methods=["POST"])
@measure_time()
@require_auth
@verify_calendar
@with_query_origin(default_origin="INVITATION_SEND")
def handle_send_invitation(calendar_id: str):
    """Envoie une invitation à un utilisateur pour partager un calendrier.
    
    Paramètres:
    - str: calendar_id - ID du calendrier à partager.

    Payload:
    - str: email - Adresse email de l'utilisateur à inviter.
    """
    owner_uid = g.uid if hasattr(g, "uid") else None  # défini avant try pour except éventuel
    try:
        payload = request.get_json(force=True)
        receiver_email = payload.get("email")

        # Utilisation de get_connection() standard (RLS actif)
        # La recherche d'utilisateur se fait via RPC sécurisé dans _get_user_by_email
        with get_connection() as conn:
            with conn.cursor() as cursor:
                receiver_user = _get_user_by_email(cursor, receiver_email)

                # Pas d'utilisateur : invitation par email (registration flow)
                if not receiver_user:
                    return _handle_registration_invite(cursor, calendar_id, receiver_email, owner_uid)

                # Utilisateur existant : flow login (shared_calendars + notif)
                receiver_uid = receiver_user.get("id")
                return _handle_existing_user_invite(cursor, calendar_id, receiver_uid, owner_uid)

    except Exception as e:
        return error_response(
            message="erreur lors de l'envoi de l'invitation",
            code="INVITATION_SEND_ERROR",
            status_code=500,
            error=str(e),
            log_extra={"calendar_id": calendar_id},
        )


@api.route("/invitations/login/<token>", methods=["GET"])
@measure_time()
@require_auth
@with_query_origin(default_origin="GET_INVITATION_LOGIN")
def handle_login_invitation(token: str):
    """Récupère une invitation de partage de calendrier par son token.
    
    Paramètres:
    - str: token - Token de l'invitation à récupérer.
    """
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
                                            AND sc.accepted_at IS NULL
                                            AND sc.deleted_at IS NULL
                                            AND c.deleted_at IS NULL
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


@api.route("/invitations/login/<token>", methods=["DELETE"])
@measure_time()
@require_auth
@verify_login_invitation_owner
@with_query_origin(default_origin="DELETE_INVITATION_LOGIN")
def delete_login_invitation(token: str):
    """Supprime une invitation de partage de calendrier par son token.
    
    Paramètres:
    - str: token - Token de l'invitation à supprimer.

    """
    owner_uid = g.uid if hasattr(g, "uid") else None
    calendar_id = g.calendar_id if hasattr(g, "calendar_id") else None
    receiver_uid = g.receiver_uid if hasattr(g, "receiver_uid") else None
    try:
        # Utilisation de get_connection() standard (RLS actif)
        # La policy "Users can delete own or sent notifications" permet la suppression
        with get_connection() as conn:
            with conn.cursor() as cursor:
                _delete_shared_calendar_by_token(cursor, token)

                # Supprimer la notif d'invitation côté receveur
                _delete_invite_notification(cursor, receiver_uid, calendar_id, owner_uid)
                conn.commit()

        # Notifier le receveur que le partage a été retiré
        link = "/calendars"
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


@api.route("/invitations/login/accept/<token>", methods=["POST"])
@measure_time()
@require_auth
@verify_login_invitation_receiver
@with_query_origin(default_origin="INVITATION_LOGIN_ACCEPT")
def handle_accept_login_invitation(token: str):
    """Accepte une invitation de partage de calendrier par son token.

    Paramètres:
    - str: token - Token de l'invitation à accepter.

    """
    uid = g.uid if hasattr(g, "uid") else None
    calendar_id = g.calendar_id if hasattr(g, "calendar_id") else None
    owner_uid = g.owner_uid if hasattr(g, "owner_uid") else None
    try:
        with get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute(
                    """
                                        UPDATE shared_calendars
                                        SET accepted_at = NOW()
                                        WHERE token = %s
                                            AND receiver_uid = %s
                                            AND accepted_at IS NULL
                                            AND deleted_at IS NULL
                                        RETURNING id
                    """,
                    (token, uid),
                )
                row = cursor.fetchone()
                id = row.get("id")
                conn.commit()

        link = f"/shared-calendars?calendar={calendar_id}"

        # Notifier le propriétaire
        notify_and_record(
            user_id=owner_uid,
            body_or_list={
                "link": link,
                "calendar_id": calendar_id,
                "sender_uid": uid,
                "shared_calendar_id" : id,
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


@api.route("/invitations/login/reject/<token>", methods=["POST"])
@measure_time()
@require_auth
@verify_login_invitation_receiver
@with_query_origin(default_origin="INVITATION_LOGIN_REJECT")
def handle_reject_login_invitation(token: str):
    """Rejette une invitation de partage de calendrier par son token.

    Paramètres:
    - str: token - Token de l'invitation à rejeter.

    """
    uid = g.uid if hasattr(g, "uid") else None
    calendar_id = g.calendar_id if hasattr(g, "calendar_id") else None
    owner_uid = g.owner_uid if hasattr(g, "owner_uid") else None
    try:
        with get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute(
                    """
                    UPDATE shared_calendars
                    SET deleted_at = COALESCE(deleted_at, NOW())
                    WHERE token = %s
                      AND receiver_uid = %s
                      AND accepted_at IS NULL
                      AND deleted_at IS NULL
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


@api.route("/invitations/registration/<token>", methods=["GET"])
@measure_time()
@require_auth
@with_query_origin(default_origin="GET_INVITATION_REGISTRATION")
def handle_registration_invitation(token: str):
    """Récupère une invitation de partage de calendrier par son token.
    
    Paramètres:
    - str: token - Token de l'invitation à récupérer.

    """
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


@api.route("/invitations/registration/<token>", methods=["DELETE"])
@measure_time()
@require_auth
@verify_registration_invitation_owner
@with_query_origin(default_origin="DELETE_INVITATION_REGISTRATION")
def delete_registration_invitation(token: str):
    """Supprime une invitation d'enregistrement par son token.
    
    Paramètres:
    - str: token - Token de l'invitation à supprimer.

    """
    uid = g.uid if hasattr(g, "uid") else None
    calendar_id = g.calendar_id if hasattr(g, "calendar_id") else None
    invited_email = g.invited_email if hasattr(g, "invited_email") else None
    try:
        with get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute(
                    """
                    UPDATE invitations
                    SET deleted_at = COALESCE(deleted_at, NOW())
                    WHERE token = %s AND calendar_id = %s AND deleted_at IS NULL
                    """,
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


def _process_accept_registration(cursor, token: str, uid: str) -> tuple[str | None, str | None, int | None]:
    """
    Traite l'acceptation de l'invitation d'enregistrement.

    Paramètres:
    - cursor: Curseur de la base de données.
    - token: Token de l'invitation.
    - uid: ID de l'utilisateur qui accepte l'invitation.
    """
    calendar_id, owner_uid = _delete_invitation_returning_calendar_owner(cursor, token)
    if not calendar_id or not owner_uid:
        return None, None, None

    cursor.execute(
        """
        INSERT INTO shared_calendars (
            receiver_uid,
            calendar_id,
            accepted_at
        )
        VALUES (%s, %s, NOW())
        RETURNING id
        """,
        (uid, calendar_id),
    )
    row = cursor.fetchone()
    id = row.get("id")
    return calendar_id, owner_uid, id

@api.route("/invitations/registration/accept/<token>", methods=["POST"])
@measure_time()
@require_auth
@with_query_origin(default_origin="ACCEPT_INVITATION_REGISTRATION")
def accept_registration_invitation(token: str):
    """Accepte une invitation d'enregistrement par son token.

    Paramètres:
    - str: token - Token de l'invitation à accepter.

    """
    uid = g.uid if hasattr(g, "uid") else None
    try:
        with get_connection() as conn:
            with conn.cursor() as cursor:
                calendar_id, owner_uid, shared_calendar_id = _process_accept_registration(cursor, token, uid)
                conn.commit()
                if not calendar_id:
                    return error_response(
                        message="invitation introuvable",
                        code="INVITATION_NOT_FOUND",
                        status_code=404,
                        log_extra={"token": token},
                    )
        link = f"/shared-calendars?calendar={calendar_id}"

        notify_and_record(
            user_id=owner_uid,
            body_or_list={
                "calendar_id": calendar_id,
                "link": link,
                "sender_uid": uid,
                "shared_calendar_id" : shared_calendar_id,
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


@api.route("/invitations/registration/reject/<token>", methods=["POST"])
@measure_time()
@require_auth
@with_query_origin(default_origin="REJECT_INVITATION_REGISTRATION")
def reject_registration_invitation(token: str):
    """Rejette une invitation d'enregistrement par son token.

    Paramètres:
    - str: token - Token de l'invitation à rejeter.

    """
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
