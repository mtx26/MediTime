from flask import request, g
from datetime import datetime
from . import api
from app.db.connection import get_connection
from app.services.user import fetch_user, update_existing_user, insert_new_user
from app.utils.responses import success_response, error_response
from app.utils.upload import upload_logo
from app.utils.decorators import require_auth, measure_time, with_query_origin


def _normalize_notification_time(raw_value):
    """Convert time strings to HH:MM:SS (accepts HH:MM or HH:MM:SS)."""
    if not isinstance(raw_value, str) or not raw_value.strip():
        raise ValueError("notification_time must be a non-empty time string")

    value = raw_value.strip()

    for time_format in ("%H:%M", "%H:%M:%S"):
        try:
            return datetime.strptime(value, time_format).strftime("%H:%M:%S")
        except ValueError:
            continue

    raise ValueError("Invalid notification_time format, expected HH:MM or HH:MM:SS")


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
                message="user not found",
                code="USER_NOT_FOUND",
                status_code=404,
                i18n_key="api.user.not_found"
            )

        return success_response(
            message="user information retrieved",
            code="USER_SYNC_SUCCESS",
            i18n_key="api.user.info_retrieved",
            data={**user}
        )
    except Exception as e:
        return error_response(
            message="error retrieving user data",
            code="USER_SYNC_ERROR",
            i18n_key="api.user.fetch_error",
            status_code=500,
            error=str(e),
        )
    

@api.route("/user/update", methods=["PUT"])
@measure_time()
@require_auth
@with_query_origin(default_origin="USER_UPDATE")
def update_user_info():
    uid = g.uid if hasattr(g, "uid") else None
    try:
        payload = request.get_json(force=True)
        if not payload:
            return error_response(
                message="No data received",
                code="USER_UPDATE_ERROR",
                i18n_key="api.user.no_data",
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
            message="updated user data",
            code="USER_UPDATE_SUCCESS",
            i18n_key="api.user.updated",
            data={**updated_user}
        )

    except Exception as e:
        return error_response(
            message="error during update",
            code="USER_UPDATE_ERROR",
            i18n_key="api.user.no_data",
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
                message="Error retrieving user photo",
                code="USER_PHOTO_ERROR",
                i18n_key="api.user.photo_error",
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
            message="user photo updated",
            code="USER_PHOTO_SUCCESS",
            i18n_key="api.user.photo_success",
            data={"photo_url": photo_url}
        )
    except Exception as e:
        return error_response(
            message="Error updating user photo",
            code="USER_PHOTO_ERROR",
            i18n_key="api.user.photo_error",
            status_code=500,
            error=str(e),
        )


@api.route("/user/notification-time", methods=["GET"])
@measure_time()
@require_auth
def get_notification_time():
    try:
        uid = g.uid if hasattr(g, "uid") else None
        with get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute(
                    "SELECT notification_time FROM users WHERE id = %s",
                    (uid,)
                )
                row = cursor.fetchone()
                if not row:
                    return error_response(
                        message="User not found",
                        code="USER_NOT_FOUND",
                        i18n_key="api.user.not_found",
                        status_code=404,
                    )
                notification_time = row["notification_time"]
                if notification_time is not None:
                    notification_time = notification_time.strftime("%H:%M:%S")

        return success_response(
            message="Notification time retrieved",
            code="USER_NOTIFICATION_TIME_SUCCESS",
            i18n_key="api.user.notification_time_retrieved",
            data={"notification_time": notification_time}
        )
    except Exception as e:
        return error_response(
            message="Error retrieving notification time",
            code="USER_NOTIFICATION_TIME_ERROR",
            i18n_key="api.user.notification_time_error",
            status_code=500,
            error=str(e),
        )


@api.route("/user/notification-time", methods=["PUT"])
@measure_time()
@require_auth
def update_notification_time():
    try:
        uid = g.uid if hasattr(g, "uid") else None
        payload = request.get_json(force=True)
        if not payload:
            return error_response(
                message="No notification time provided",
                code="USER_NOTIFICATION_TIME_ERROR",
                i18n_key="api.user.notification_time_error",
                status_code=400,
            )

        raw_notification_time = payload.get("notification_time", payload.get("notificationTime"))
        if raw_notification_time is None:
            return error_response(
                message="No notification time provided",
                code="USER_NOTIFICATION_TIME_ERROR",
                i18n_key="api.user.notification_time_error",
                status_code=400,
            )

        try:
            notification_time = _normalize_notification_time(raw_notification_time)
        except ValueError as e:
            return error_response(
                message=f"Invalid notification time format: {str(e)}",
                code="USER_NOTIFICATION_TIME_INVALID_FORMAT",
                i18n_key="api.user.notification_time_error",
                status_code=400,
            )
        
        with get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute(
                    "UPDATE users SET notification_time = %s WHERE id = %s",
                    (notification_time, uid)
                )
                conn.commit()

        return success_response(
            message="Notification time updated",
            code="USER_NOTIFICATION_TIME_SUCCESS",
            i18n_key="api.user.notification_time_updated",
            data={"notification_time": notification_time}
        )
    except Exception as e:
        return error_response(
            message="Error updating notification time",
            code="USER_NOTIFICATION_TIME_ERROR",
            i18n_key="api.user.notification_time_error",
            status_code=500,
            error=str(e),
        )
