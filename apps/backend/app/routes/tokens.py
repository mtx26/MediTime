from flask import request, g
from . import api
from datetime import datetime, timezone
from app.db.connection import get_connection
from app.services.calendar import generate_calendar_schedule
from app.utils.responses import success_response, error_response, warning_response
from app.utils.decorators import require_auth, measure_time, with_query_origin, verify_calendar, verify_token_owner, verify_token

# Route pour récupérer tous les tokens et les informations associées
@api.route("/tokens", methods=["GET"])
@measure_time()
@require_auth
@with_query_origin(default_origin="REALTIME_TOKENS_FETCH")
def handle_tokens():
    try:
        uid = g.uid if hasattr(g, "uid") else None

        with get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute("SELECT * FROM shared_tokens WHERE owner_uid = %s AND deleted_at IS NULL", (uid,))
                tokens_list = cursor.fetchall()

        return success_response(
            message="tokens recovered", 
            code="TOKENS_FETCH",
            i18n_key="api.tokens.retrieved", 
            data={"tokens": tokens_list}
        )
        
    except Exception as e:
        return error_response(
            message="Error retrieving tokens",
            code="TOKENS_ERROR",
            i18n_key="api.tokens.fetch_error", 
            status_code=500, 
            error=str(e)
        )


# Route pour créer un lien de partage avec un token
@api.route("/tokens/<calendar_id>", methods=["POST"])
@measure_time()
@require_auth
@verify_calendar
@with_query_origin(default_origin="TOKEN_CREATE")
def handle_create_token(calendar_id):
    try:
        owner_uid = g.uid if hasattr(g, "uid") else None

        payload = request.get_json(force=True)

        expires_at = payload.get("expiresAt")
        if not expires_at:
            expires_at = None

        # Vérifier si le calendrier est déjà partagé
        with get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute("SELECT * FROM shared_tokens WHERE calendar_id = %s AND owner_uid = %s AND deleted_at IS NULL", (calendar_id, owner_uid))
                token = cursor.fetchone()
                if token:
                    return warning_response(
                        message="token already exists for this calendar", 
                        code="TOKEN_ALREADY_SHARED",
                        i18n_key="api.tokens.already_shared", 
                        status_code=400, 
                        log_extra={"calendar_id": calendar_id}
                    )
                
        
                cursor.execute(
                    """
                    INSERT INTO shared_tokens (calendar_id, expires_at, owner_uid)
                    VALUES (%s, %s, %s)
                    """,
                    (calendar_id, expires_at, owner_uid)
                )
                conn.commit()

                return success_response(
                    message="token created", 
                    code="TOKEN_CREATED",
                    i18n_key="api.tokens.created", 
                    log_extra={"calendar_id": calendar_id}
                )

    except Exception as e:
        return error_response(
            message="error during token creation",
            code="TOKEN_CREATE_ERROR",
            i18n_key="api.tokens.creation_error", 
            status_code=500,
            error=str(e),
            log_extra={"calendar_id": calendar_id}
        )


# Route pour mettre à jour l'expiration d'un token
@api.route("/tokens/expiration/<token>", methods=["PATCH"])
@measure_time()
@require_auth
@verify_token_owner
@with_query_origin(default_origin="TOKEN_EXPIRATION_UPDATE")
def handle_update_token_expiration(token):
    try:

        payload = request.get_json(force=True)
        expires_at = payload.get("expiresAt")

        if not expires_at:
            expires_at = None

        if expires_at:
            expires_at = datetime.strptime(expires_at, "%Y-%m-%d").date()

        with get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute(
                    "UPDATE shared_tokens SET expires_at = %s WHERE id = %s AND deleted_at IS NULL",
                    (expires_at, token)
                )
                conn.commit()

                return success_response(
                    message="token expiration update", 
                    code="TOKEN_EXPIRATION_UPDATED",
                    i18n_key="api.tokens.expiration_updated", 
                    log_extra={"token": token}
                )

    except Exception as e:
        return error_response(
            message="Error updating token expiration",
            code="TOKEN_EXPIRATION_UPDATE_ERROR",
            i18n_key="api.tokens.expiration_update_error", 
            status_code=500,
            error=str(e),
            log_extra={"token": token}
        )


# Route pour générer un calendrier partagé pour un token
@api.route("/tokens/<token>/schedule", methods=["GET"])
@measure_time()
@verify_token
@with_query_origin(default_origin="TOKEN_FETCH_SCHEDULE")
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
            message="calendar generated", 
            code="TOKEN_GENERATE_SCHEDULE_SUCCESS",
            i18n_key="api.tokens.calendar_generated", 
            uid="unknown", 
            origin="TOKEN_GENERATE_SCHEDULE", 
            data={"schedule": schedule, "table": table, "calendar_name": calendar_name},
            log_extra={"token": token}
        )
    except Exception as e:
        return error_response(
            message="error during calendar generation",
            code="TOKEN_GENERATE_SCHEDULE_ERROR",
            i18n_key="api.tokens.calendar_generation_error", 
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
@with_query_origin(default_origin="TOKEN_METADATA_LOAD")
def handle_get_token_metadata(token):
    try:
        calendar_id = g.calendar_id

        with get_connection() as conn:
            with conn.cursor() as cursor:
                # On injecte le token dans la session DB via une CTE pour que la politique RLS puisse le vérifier
                cursor.execute("""
                    WITH set_session AS (
                        SELECT set_config('app.current_token', %s, true)
                    )
                    SELECT owner_uid FROM set_session, shared_tokens WHERE id = %s AND deleted_at IS NULL
                """, (token, token))
                token_data = cursor.fetchone()
                if not token_data:
                    return warning_response(
                        message="token not found", 
                        code="TOKEN_NOT_FOUND",
                        i18n_key="api.tokens.not_found", 
                        status_code=404, 
                        uid="unknown", 
                        origin="TOKEN_METADATA_LOAD", 
                        log_extra={"token": token}
                    )

                owner_uid = token_data.get("owner_uid") if token_data else None

                return success_response(
                    message="retrieved token metadata",
                    code="TOKEN_METADATA_SUCCESS",
                    i18n_key="api.tokens.metadata_retrieved",
                    origin="TOKEN_METADATA_FETCH",
                    uid="unknown",
                    data={"calendar_id": calendar_id, "owner_uid": owner_uid},
                )

    except Exception as e:
        return error_response(
            message="Error retrieving token metadata",
            code="TOKEN_METADATA_ERROR",
            i18n_key="api.tokens.metadata_fetch_error",
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
@with_query_origin(default_origin="TOKEN_DELETE")
def handle_delete_token(token):
    try:

        with get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute(
                    "UPDATE shared_tokens SET deleted_at = COALESCE(deleted_at, NOW()) WHERE id = %s",
                    (token,)
                )
                conn.commit()

                return success_response(
                    message="token removed", 
                    code="TOKEN_DELETE_SUCCESS",
                    i18n_key="api.tokens.deleted",
                    log_extra={"token": token}
                )

    except Exception as e:
        return error_response(
            message="error while deleting the token",
            code="TOKEN_DELETE_ERROR",
            i18n_key="api.tokens.delete_error", 
            status_code=500,
            error=str(e),
            log_extra={"token": token}
        )