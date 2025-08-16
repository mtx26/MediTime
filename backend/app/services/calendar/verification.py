from functools import wraps
from datetime import datetime, timezone
from flask import g, request

from app.db.connection import get_connection
from app.utils.logging import log_backend as logger
from app.utils.responses import warning_response

ACCESS_DENIED_MSG = "accès refusé"


def _extract_calendar_id(kwargs) -> str | None:
    cal_id = kwargs.get("calendar_id")
    if cal_id:
        return cal_id
    cal_id = getattr(request, "view_args", {}).get("calendar_id")
    if cal_id:
        return cal_id
    if request.is_json:
        body = request.get_json(silent=True) or {}
        return body.get("calendarId") or body.get("calendar_id")
    return None


def _extract_token(kwargs) -> str | None:
    return (
        kwargs.get("token")
        or getattr(request, "view_args", {}).get("token")
        or request.args.get("token")
    )


def _verify_calendar_share(calendar_id: str, receiver_uid: str) -> bool:
    try:
        with get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute("""
                    SELECT
                        EXISTS (SELECT 1 FROM calendars WHERE id = %s) AS calendar_exists,
                        EXISTS (
                            SELECT 1
                            FROM shared_calendars
                            WHERE calendar_id = %s AND receiver_uid = %s
                        ) AS share_exists
                """, (calendar_id, calendar_id, receiver_uid))

                row = cursor.fetchone()

                # Calendrier inexistant
                if not row or not row.get("calendar_exists"):
                    return False

                # Partage absent pour ce receiver
                if not row.get("share_exists"):
                    logger.warning(ACCESS_DENIED_MSG, {
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
            cal_id = _extract_calendar_id(kwargs)
            uid = kwargs.get("receiver_uid") or getattr(g, "uid", None)
            if not cal_id or not _verify_calendar_share(cal_id, uid):
                return warning_response(
                    message=ACCESS_DENIED_MSG,
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
            cal_id = _extract_calendar_id(kwargs)
            user_id = kwargs.get("uid") or getattr(g, "uid", None)
            if not cal_id or not _verify_calendar(cal_id, user_id):
                return warning_response(
                    message=ACCESS_DENIED_MSG,
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
            tok = _extract_token(kwargs)
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
            tok = _extract_token(kwargs)
            user_id = kwargs.get("uid") or getattr(g, "uid", None)
            if not tok or not _verify_token_owner(tok, user_id):
                return warning_response(
                    message=ACCESS_DENIED_MSG,
                    code="TOKEN_OWNER_VERIFY_DENIED",
                    uid=user_id,
                    origin="TOKEN_OWNER_VERIFY",
                )
            return f(*args, **kwargs)

        return wrapper

    return _verify_token_owner(token, uid)


def _verify_login_invite_owner(token: str, uid: str):
    try:
        with get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute("""
                    SELECT sc.calendar_id, sc.receiver_uid, c.owner_uid
                    FROM shared_calendars sc
                    JOIN calendars c ON c.id = sc.calendar_id
                    WHERE sc.token = %s
                """, (token,))
                row = cursor.fetchone()
                if not row:
                    return False

                if row.get("owner_uid") != uid:
                    return False

                # On hydrate via retour: calendar_id + receiver_uid
                return {
                    "calendar_id": row.get("calendar_id"),
                    "receiver_uid": row.get("receiver_uid"),
                }

    except Exception as e:
        logger.error("erreur lors de la vérification du login invite owner", {
            "origin": "LOGIN_INVITE_OWNER_VERIFY_ERROR",
            "token": token,
            "uid": uid,
            "error": str(e)
        })
        return False


def verify_login_invitation_owner(token=None, uid=None):
    if callable(token):
        f = token

        @wraps(f)
        def wrapper(*args, **kwargs):
            tok = (
                kwargs.get("token")
                or (request.view_args.get("token") if request.view_args else None)
                or request.args.get("token")
            )
            user_id = kwargs.get("uid") or getattr(g, "uid", None)
            data = _verify_login_invite_owner(tok, user_id) if tok and user_id else False
            if not data:
                return warning_response(
                    message=ACCESS_DENIED_MSG,
                    code="LOGIN_INVITE_OWNER_VERIFY_DENIED",
                    uid=user_id,
                    origin="LOGIN_INVITE_OWNER_VERIFY",
                )
            # hydrate pour le handler
            g.calendar_id = data["calendar_id"]
            g.receiver_uid = data["receiver_uid"]
            return f(*args, **kwargs)

        return wrapper

    # mode appel direct
    return _verify_login_invite_owner(token, uid)


# --- REGISTRATION INVITATION (invitations) ---

def _verify_registration_invite_owner(token: str, uid: str):
    try:
        with get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute("""
                    SELECT i.calendar_id, i.invited_email, c.owner_uid
                    FROM invitations i
                    JOIN calendars c ON c.id = i.calendar_id
                    WHERE i.token = %s
                """, (token,))
                row = cursor.fetchone()
                if not row:
                    return False

                if row.get("owner_uid") != uid:
                    return False

                # On hydrate via retour: calendar_id + invited_email
                return {
                    "calendar_id": row.get("calendar_id"),
                    "invited_email": row.get("invited_email"),
                }

    except Exception as e:
        logger.error("erreur lors de la vérification du registration invite owner", {
            "origin": "REG_INVITE_OWNER_VERIFY_ERROR",
            "token": token,
            "uid": uid,
            "error": str(e)
        })
        return False


def verify_registration_invitation_owner(token=None, uid=None):
    if callable(token):
        f = token

        @wraps(f)
        def wrapper(*args, **kwargs):
            tok = (
                kwargs.get("token")
                or (request.view_args.get("token") if request.view_args else None)
                or request.args.get("token")
            )
            user_id = kwargs.get("uid") or getattr(g, "uid", None)
            data = _verify_registration_invite_owner(tok, user_id) if tok and user_id else False
            if not data:
                return warning_response(
                    message=ACCESS_DENIED_MSG,
                    code="REG_INVITE_OWNER_VERIFY_DENIED",
                    uid=user_id,
                    origin="REG_INVITE_OWNER_VERIFY",
                )
            # hydrate pour le handler
            g.calendar_id = data["calendar_id"]
            g.invited_email = data["invited_email"]
            return f(*args, **kwargs)

        return wrapper

    # mode appel direct
    return _verify_registration_invite_owner(token, uid)


def _verify_login_invite_receiver(token: str, uid: str):
    try:
        with get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute("""
                    SELECT sc.calendar_id, sc.receiver_uid, sc.accepted, c.owner_uid
                    FROM shared_calendars sc
                    JOIN calendars c ON c.id = sc.calendar_id
                    WHERE sc.token = %s
                """, (token,))
                row = cursor.fetchone()
                if not row:
                    return False

                # ici on exige que le token cible bien ce receiver
                if row.get("receiver_uid") != uid:
                    return False

                return {
                    "calendar_id": row.get("calendar_id"),
                    "owner_uid": row.get("owner_uid"),
                    "accepted": row.get("accepted"),
                }

    except Exception as e:
        logger.error("erreur lors de la vérification du login invite receiver", {
            "origin": "LOGIN_INVITE_RECEIVER_VERIFY_ERROR",
            "token": token,
            "uid": uid,
            "error": str(e)
        })
        return False


def verify_login_invitation_receiver(token=None, uid=None):
    if callable(token):
        f = token

        @wraps(f)
        def wrapper(*args, **kwargs):
            tok = (
                kwargs.get("token")
                or (request.view_args.get("token") if request.view_args else None)
                or request.args.get("token")
            )
            user_id = kwargs.get("uid") or getattr(g, "uid", None)
            data = _verify_login_invite_receiver(tok, user_id) if tok and user_id else False
            if not data:
                return warning_response(
                    message=ACCESS_DENIED_MSG,
                    code="LOGIN_INVITE_RECEIVER_VERIFY_DENIED",
                    uid=user_id,
                    origin="LOGIN_INVITE_RECEIVER_VERIFY",
                )
            # hydrate pour le handler
            g.calendar_id = data["calendar_id"]
            g.owner_uid = data["owner_uid"]
            g.invitation_accepted = data["accepted"]
            return f(*args, **kwargs)

        return wrapper

    # mode appel direct
    return _verify_login_invite_receiver(token, uid)
