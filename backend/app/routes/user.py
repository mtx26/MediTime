from . import api
from flask import request, g
from app.utils.auth import require_auth
from app.utils.responses import success_response, error_response
from app.services.user import fetch_user, update_existing_user, insert_new_user
import time
from app.utils.upload import upload_logo
from app.db.connection import get_connection

@api.route("/user/sync", methods=["GET"])
@require_auth
def get_user_info():
    uid = g.uid
    try:
        user = fetch_user(uid)
        if not user:
            return error_response(
                message="utilisateur introuvable",
                code="USER_NOT_FOUND",
                status_code=404,
                uid=uid,
                origin="USER_SYNC_GET"
            )

        return success_response(
            message="informations utilisateur récupérées",
            code="USER_SYNC_SUCCESS",
            uid=uid,
            origin="USER_SYNC_GET",
            data={**user}
        )
    except Exception as e:
        return error_response(
            message="erreur lors de la récupération des données utilisateur",
            code="USER_SYNC_ERROR",
            status_code=500,
            uid=uid,
            origin="USER_SYNC_GET",
            error=str(e),
        )
    

@api.route("/user/update", methods=["POST"])
@require_auth
def update_user_info():
    uid = g.uid
    try:
        payload = request.get_json(force=True)
        if not payload:
            return error_response(
                message="aucune donnée reçue",
                code="USER_UPDATE_ERROR",
                status_code=400,
                uid=uid,
                origin="USER_UPDATE"
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
            uid=uid,
            origin="USER_UPDATE",
            data={**updated_user}
        )

    except Exception as e:
        return error_response(
            message="erreur lors de la mise à jour",
            code="USER_UPDATE_ERROR",
            status_code=500,
            uid=uid,
            origin="USER_UPDATE",
            error=str(e),
        )


@api.route("/user/photo", methods=["POST"])
@require_auth
def handle_user_photo():
    uid = None
    try:
        t_0 = time.time()
        uid = g.uid

        photo = request.files.get("photo")
        if not photo:
            return error_response(
                message="erreur lors de la récupération de la photo de l'utilisateur",
                code="USER_PHOTO_ERROR",
                status_code=400,
                uid=uid,
                origin="USER_PHOTO"
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
            uid=uid,
            origin="USER_PHOTO",
            data={"uid": uid, "photo_url": photo_url, "time": time.time() - t_0}
        )
    except Exception as e:
        return error_response(
            message="erreur lors de la mise à jour de la photo de l'utilisateur",
            code="USER_PHOTO_ERROR",
            status_code=500,
            uid=uid,
            origin="USER_PHOTO",
            error=str(e),
        )