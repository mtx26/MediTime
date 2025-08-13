from functools import wraps
from datetime import datetime, timezone
from flask import g, request

from app.db.connection import get_connection
from app.utils.logging import log_backend as logger
from app.utils.responses import warning_response

def _verify_calendar_share(calendar_id: str, receiver_uid: str) -> bool:
    try:
        with get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute("SELECT * FROM calendars WHERE id = %s", (calendar_id,))
                calendar = cursor.fetchone()
                if not calendar:
                    return False
                
                cursor.execute("SELECT * FROM shared_calendars WHERE calendar_id = %s AND receiver_uid = %s", (calendar_id, receiver_uid,))
                shared_calendar = cursor.fetchone()
                if not shared_calendar:
                    logger.warning("accès refusé", {
                        "origin": "SHARED_VERIFY",
                        "uid": receiver_uid,
                        "calendar_id": calendar_id,
                    })
                    return False
                
                return True

    except Exception as e:
        logger.error("erreur lors de la vérification de l'accès au calendrier partagé", {
            "origin": "SHARED_VERIFY_ERROR",
            "uid": receiver_uid,
            "calendar_id": calendar_id, 
            "error": str(e)
        })
        return False

def _verify_calendar(calendar_id: str, uid: str) -> bool:
    try:
        with get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute("SELECT * FROM calendars WHERE id = %s AND owner_uid = %s", (calendar_id, uid,))
                calendar = cursor.fetchone()
                if not calendar:
                    return False
                
                return True

    except Exception as e:
        logger.error("erreur lors de la vérification de l'accès au calendrier", {
            "origin": "CALENDAR_VERIFY_ERROR",
            "uid": uid,
            "calendar_id": calendar_id,
            "error": str(e)
        })
        return False

def _verify_token(token: str):
    try:
        with get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute("SELECT * FROM shared_tokens WHERE id = %s", (token,))
                token_data = cursor.fetchone()
                if not token_data:
                    return False

                calendar_id = token_data.get("calendar_id")
                owner_uid = token_data.get("owner_uid")
                expires_at = token_data.get("expires_at")
                revoked = token_data.get("revoked")
                permissions = token_data.get("permissions")

                if not _verify_calendar(calendar_id, owner_uid):
                    return False

                now = datetime.now(timezone.utc).date()

                if expires_at and now > expires_at.date():
                    return False

                if revoked:
                    return False

                if "read" not in permissions:
                    return False

                return calendar_id

    except Exception as e:
        logger.error("erreur lors de la vérification du token", {
            "origin": "TOKEN_VERIFY_ERROR",
            "token": token,
            "error": str(e)
        })
        return False

def _verify_token_owner(token: str, uid: str) -> bool:
    try:
        with get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute("SELECT * FROM shared_tokens WHERE id = %s", (token,))
                token_data = cursor.fetchone()
                if not token_data:
                    return False

                if token_data.get("owner_uid") != uid:
                    return False

                return True

    except Exception as e:
        logger.error("erreur lors de la vérification de la propriété du token", {
            "origin": "TOKEN_OWNER_VERIFY_ERROR",
            "token": token,
            "uid": uid,
            "error": str(e)
        })
        return False


def verify_calendar_share(calendar_id=None, receiver_uid=None):
    if callable(calendar_id):
        f = calendar_id

        @wraps(f)
        def wrapper(*args, **kwargs):
            cal_id = kwargs.get("calendar_id")
            if not cal_id and request.view_args:
                cal_id = request.view_args.get("calendar_id")
            if not cal_id and request.is_json:
                body = request.get_json(silent=True) or {}
                cal_id = body.get("calendarId") or body.get("calendar_id")
            uid = kwargs.get("receiver_uid") or getattr(g, "uid", None)
            if not cal_id or not _verify_calendar_share(cal_id, uid):
                return warning_response(
                    message="accès refusé",
                    code="SHARED_VERIFY_DENIED",
                    uid=uid,
                    origin="SHARED_VERIFY",
                )
            return f(*args, **kwargs)

        return wrapper

    return _verify_calendar_share(calendar_id, receiver_uid)


def verify_calendar(calendar_id=None, uid=None):
    if callable(calendar_id):
        f = calendar_id

        @wraps(f)
        def wrapper(*args, **kwargs):
            cal_id = kwargs.get("calendar_id")
            if not cal_id and request.view_args:
                cal_id = request.view_args.get("calendar_id")
            if not cal_id and request.is_json:
                body = request.get_json(silent=True) or {}
                cal_id = body.get("calendarId") or body.get("calendar_id")
            user_id = kwargs.get("uid") or getattr(g, "uid", None)
            if not cal_id or not _verify_calendar(cal_id, user_id):
                return warning_response(
                    message="accès refusé",
                    code="CALENDAR_VERIFY_DENIED",
                    uid=user_id,
                    origin="CALENDAR_VERIFY",
                )
            return f(*args, **kwargs)

        return wrapper

    return _verify_calendar(calendar_id, uid)


def verify_token(token=None):
    if callable(token):
        f = token

        @wraps(f)
        def wrapper(*args, **kwargs):
            tok = (
                kwargs.get("token")
                or request.view_args.get("token") if request.view_args else None
                or request.args.get("token")
            )
            calendar_id = _verify_token(tok)
            if not calendar_id:
                return warning_response(
                    message="token invalide",
                    code="TOKEN_VERIFY_DENIED",
                    origin="TOKEN_VERIFY",
                )
            g.calendar_id = calendar_id
            return f(*args, **kwargs)

        return wrapper

    return _verify_token(token)


def verify_token_owner(token=None, uid=None):
    if callable(token):
        f = token

        @wraps(f)
        def wrapper(*args, **kwargs):
            tok = (
                kwargs.get("token")
                or request.view_args.get("token") if request.view_args else None
                or request.args.get("token")
            )
            user_id = kwargs.get("uid") or getattr(g, "uid", None)
            if not tok or not _verify_token_owner(tok, user_id):
                return warning_response(
                    message="accès refusé",
                    code="TOKEN_OWNER_VERIFY_DENIED",
                    uid=user_id,
                    origin="TOKEN_OWNER_VERIFY",
                )
            return f(*args, **kwargs)

        return wrapper

    return _verify_token_owner(token, uid)
