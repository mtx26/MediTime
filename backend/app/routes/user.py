from flask import request, g
from . import api
from app.db.connection import get_connection
from app.services.user import fetch_user, update_existing_user, insert_new_user
from app.utils.responses import success_response, error_response
from app.utils.upload import upload_logo
from app.utils.decorators import require_auth, measure_time, with_query_origin


@api.route("/user/sync", methods=["GET"])
@measure_time()
@require_auth
@with_query_origin(default_origin="USER_SYNC_GET")
def get_user_info():
    uid = g.uid if hasattr(g, "uid") else None
    try:
        user = fetch_user(uid)
        if not user:
            return error_response(
                message="utilisateur introuvable",
                code="USER_NOT_FOUND",
                status_code=404,
            )

        return success_response(
            message="informations utilisateur récupérées",
            code="USER_SYNC_SUCCESS",
            data={**user}
        )
    except Exception as e:
        return error_response(
            message="erreur lors de la récupération des données utilisateur",
            code="USER_SYNC_ERROR",
            status_code=500,
            error=str(e),
        )
    

@api.route("/user/update", methods=["POST"])
@measure_time()
@require_auth
@with_query_origin(default_origin="USER_UPDATE")
def update_user_info():
    uid = g.uid if hasattr(g, "uid") else None
    try:
        payload = request.get_json(force=True)
        if not payload:
            return error_response(
                message="aucune donnée reçue",
                code="USER_UPDATE_ERROR",
                status_code=400,
            )

        display_name = payload.get("display_name", None)
        email = payload.get("email", None)
        photo_url = payload.get("photo_url", None)
        email_enabled = payload.get("email_enabled", None)
        push_enabled = payload.get("push_enabled", None)

        user_db = fetch_user(uid)

        if user_db:
            updated_user = update_existing_user(uid, user_db, display_name, email, photo_url, email_enabled, push_enabled)
        else:
            updated_user = insert_new_user(uid, display_name, email, photo_url, email_enabled, push_enabled)

        return success_response(
            message="données utilisateur mises à jour",
            code="USER_UPDATE_SUCCESS",
            data={**updated_user}
        )

    except Exception as e:
        return error_response(
            message="erreur lors de la mise à jour",
            code="USER_UPDATE_ERROR",
            status_code=500,
            error=str(e),
        )


@api.route("/user/photo", methods=["POST"])
@measure_time()
@require_auth
@with_query_origin(default_origin="USER_PHOTO")
def handle_user_photo():
    try:
        uid = g.uid if hasattr(g, "uid") else None

        photo = request.files.get("photo")
        if not photo:
            return error_response(
                message="erreur lors de la récupération de la photo de l'utilisateur",
                code="USER_PHOTO_ERROR",
                status_code=400,
            )

        photo_url = upload_logo(photo)
        with get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute(
                    "UPDATE users SET photo_url = %s WHERE id = %s",
                    (photo_url, uid)
                )
                conn.commit()

        return success_response(
            message="photo de l'utilisateur mise à jour",
            code="USER_PHOTO_SUCCESS",
            data={"photo_url": photo_url}
        )
    except Exception as e:
        return error_response(
            message="erreur lors de la mise à jour de la photo de l'utilisateur",
            code="USER_PHOTO_ERROR",
            status_code=500,
            error=str(e),
        )