from app.utils.responses import success_response, error_response, warning_response
from app.utils.auth import require_auth
from datetime import datetime, timezone
from . import api
from flask import request, g
from app.db.connection import get_connection
from app.services.calendar import generate_calendar_schedule
from app.services.calendar import verify_calendar, verify_token_owner, verify_token
from app.utils.measure import measure_time

# Route pour récupérer tous les tokens et les informations associées
@api.route("/tokens", methods=["GET"])
@measure_time()
@require_auth
def handle_tokens():
    try:
        uid = g.uid

        with get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute("SELECT * FROM shared_tokens WHERE owner_uid = %s", (uid,))
                tokens_list = cursor.fetchall()

        return success_response(
            message="tokens récupérés", 
            code="TOKENS_FETCH", 
            uid=uid, 
            origin="TOKENS_FETCH", 
            data={"tokens": tokens_list}
        )
        
    except Exception as e:
        return error_response(
            message="erreur lors de la récupération des tokens",
            code="TOKENS_ERROR", 
            status_code=500, 
            uid=uid, 
            origin="TOKENS_FETCH", 
            error=str(e)
        )


# Route pour créer un lien de partage avec un token
@api.route("/tokens/<calendar_id>", methods=["POST"])
@measure_time()
@require_auth
@verify_calendar
def handle_create_token(calendar_id):
    try:
        owner_uid = g.uid

        payload = request.get_json(force=True)

        expires_at = payload.get("expiresAt")
        if not expires_at:
            expires_at = None

        permissions = payload.get("permissions")

        if not permissions:
            permissions = ["read"]


        # Verifier si le calendrier est déjà partagé
        with get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute("SELECT * FROM shared_tokens WHERE calendar_id = %s AND owner_uid = %s", (calendar_id, owner_uid))
                token = cursor.fetchone()
                if token:
                    return warning_response(
                        message="token déjà partagé", 
                        code="TOKEN_ALREADY_SHARED", 
                        status_code=400, 
                        uid=owner_uid, 
                        origin="TOKEN_ALREADY_SHARED", 
                        log_extra={"calendar_id": calendar_id}
                    )
                
        
                cursor.execute(
                    """
                    INSERT INTO shared_tokens (calendar_id, expires_at, permissions, revoked, owner_uid) VALUES (%s, %s, %s, %s, %s)
                    """,
                    (calendar_id, expires_at, permissions, False, owner_uid)
                )

                return success_response(
                    message="token créé", 
                    code="TOKEN_CREATED", 
                    uid=owner_uid, 
                    origin="TOKEN_CREATE",
                    log_extra={"calendar_id": calendar_id}
                )

    except Exception as e:
        return error_response(
            message="erreur lors de la création du token",
            code="TOKEN_CREATE_ERROR", 
            status_code=500, 
            uid=owner_uid, 
            origin="TOKEN_CREATE", 
            error=str(e),
            log_extra={"calendar_id": calendar_id}
        )


# Route pour révoquer un token
@api.route("/tokens/revoke/<token>", methods=["POST"])
@measure_time()
@require_auth
@verify_token_owner
def handle_update_revoke_token(token):
    try:
        owner_uid = g.uid

        with get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute("UPDATE shared_tokens SET revoked = not revoked WHERE id = %s AND owner_uid = %s", (token, owner_uid))

                cursor.execute("SELECT revoked FROM shared_tokens WHERE id = %s AND owner_uid = %s", (token, owner_uid))
                revoked = cursor.fetchone()
                revoked = revoked.get("revoked")

                return success_response(
                    message="token révoqué" if revoked else "token réactivé", 
                    code="TOKEN_REVOKE_SUCCESS" if revoked else "TOKEN_REACTIVATED_SUCCESS", 
                    uid=owner_uid, 
                    origin="TOKEN_REVOKE", 
                    log_extra={"token": token}
                )

    except Exception as e:
        return error_response(
            message="erreur lors de la révocation du token",
            code="TOKEN_REVOKE_ERROR", 
            status_code=500, 
            uid=owner_uid, 
            origin="TOKEN_REVOKE", 
            error=str(e),
            log_extra={"token": token}
        )


# Route pour mettre à jour l'expiration d'un token
@api.route("/tokens/expiration/<token>", methods=["POST"])
@measure_time()
@require_auth
@verify_token_owner
def handle_update_token_expiration(token):
    try:
        owner_uid = g.uid

        payload = request.get_json(force=True)
        expires_at = payload.get("expiresAt")

        if not expires_at:
            expires_at = None

        if expires_at:
            expires_at = datetime.strptime(expires_at, "%Y-%m-%d").date()

        with get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute("UPDATE shared_tokens SET expires_at = %s WHERE id = %s AND owner_uid = %s", (expires_at, token, owner_uid))

                return success_response(
                    message="expiration du token mise à jour", 
                    code="TOKEN_EXPIRATION_UPDATED", 
                    uid=owner_uid, 
                    origin="TOKEN_EXPIRATION_UPDATE", 
                    log_extra={"token": token}
                )

    except Exception as e:
        return error_response(
            message="erreur lors de la mise à jour de l'expiration du token",
            code="TOKEN_EXPIRATION_UPDATE_ERROR", 
            status_code=500, 
            uid=owner_uid, 
            origin="TOKEN_EXPIRATION_UPDATE", 
            error=str(e),
            log_extra={"token": token}
        )


# Route pour mettre à jour les permissions d'un token
@api.route("/tokens/permissions/<token>", methods=["POST"])
@measure_time()
@require_auth
@verify_token_owner
def handle_update_token_permissions(token):
    try:
        owner_uid = g.uid

        payload = request.get_json(force=True)

        permissions = payload.get("permissions")

        with get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute("UPDATE shared_tokens SET permissions = %s WHERE id = %s AND owner_uid = %s", (permissions, token, owner_uid))

                return success_response(
                    message="permissions du token mises à jour", 
                    code="TOKEN_PERMISSIONS_UPDATED", 
                    uid=owner_uid, 
                    origin="TOKEN_PERMISSIONS_UPDATE", 
                    log_extra={"token": token}
                )

    except Exception as e:
        return error_response(
            message="erreur lors de la mise à jour des permissions du token",
            code="TOKEN_PERMISSIONS_UPDATE_ERROR", 
            status_code=500, 
            uid=owner_uid, 
            origin="TOKEN_PERMISSIONS_UPDATE", 
            error=str(e),
            log_extra={"token": token}
        )


# Route pour générer un calendrier partagé pour un token
@api.route("/tokens/<token>/schedule", methods=["GET"])
@measure_time()
@verify_token
def handle_generate_token_schedule(token):
    try:
        start_date = request.args.get("startDate")

        if not start_date:
            start_date = datetime.now(timezone.utc).date()
        else:
            start_date = datetime.strptime(start_date, "%Y-%m-%d").date()

        calendar_id = g.calendar_id

        schedule, table, calendar_name = generate_calendar_schedule(calendar_id, start_date)

        return success_response(
            message="calendrier généré", 
            code="TOKEN_GENERATE_SCHEDULE_SUCCESS", 
            uid="unknown", 
            origin="TOKEN_GENERATE_SCHEDULE", 
            data={"schedule": schedule, "table": table, "calendar_name": calendar_name},
            log_extra={"token": token}
        )
    except Exception as e:
        return error_response(
            message="erreur lors de la génération du calendrier",
            code="TOKEN_GENERATE_SCHEDULE_ERROR", 
            status_code=500, 
            uid="unknown", 
            origin="TOKEN_GENERATE_SCHEDULE", 
            error=str(e),
            log_extra={"token": token}
        )

# Route pour obtenir les métadonnées d’un token public
@api.route("/tokens/<token>", methods=["GET"])
@measure_time()
@verify_token
def handle_get_token_metadata(token):
    try:
        calendar_id = g.calendar_id

        with get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute("SELECT owner_uid FROM shared_tokens WHERE id = %s", (token,))
                token_data = cursor.fetchone()
                if not token_data:
                    return warning_response(
                        message="token non trouvé", 
                        code="TOKEN_NOT_FOUND", 
                        status_code=404, 
                        uid="unknown", 
                        origin="TOKEN_METADATA_LOAD", 
                        log_extra={"token": token}
                    )

                owner_uid = token_data.get("owner_uid")

                return success_response(
                    message="métadonnées du token récupérées",
                    code="TOKEN_METADATA_SUCCESS",
                    origin="TOKEN_METADATA_FETCH",
                    uid="unknown",
                    data={"calendar_id": calendar_id, "owner_uid": owner_uid},
                )

    except Exception as e:
        return error_response(
            message="erreur lors de la récupération des métadonnées du token",
            code="TOKEN_METADATA_ERROR",
            status_code=500,
            error=str(e),
            origin="TOKEN_METADATA_FETCH",
            uid="unknown",
            log_extra={"token": token}
        )


# Route pour supprimer un token
@api.route("/tokens/<token>", methods=["DELETE"])
@measure_time()
@require_auth
@verify_token_owner
def handle_delete_token(token):
    try:
        owner_uid = g.uid

        with get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute("DELETE FROM shared_tokens WHERE id = %s", (token,))

                return success_response(
                    message="token supprimé", 
                    code="TOKEN_DELETE_SUCCESS", 
                    uid=owner_uid, 
                    origin="TOKEN_DELETE", 
                    log_extra={"token": token}
                )

    except Exception as e:
        return error_response(
            message="erreur lors de la suppression du token",
            code="TOKEN_DELETE_ERROR", 
            status_code=500, 
            uid=owner_uid, 
            origin="TOKEN_DELETE", 
            error=str(e),
            log_extra={"token": token}
        )