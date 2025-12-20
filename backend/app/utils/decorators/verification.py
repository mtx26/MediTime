from functools import wraps
from datetime import datetime, timezone
from flask import g, request

from app.db.connection import get_connection
from app.utils.logging import log_backend as logger
from app.utils.responses import warning_response

ACCESS_DENIED_MSG = "accès refusé"


def _extract_calendar_id(kwargs: dict) -> str | None:
    """Extrait l'ID du calendrier des différents emplacements possibles dans la requête.

    Paramètres:
    - kwargs (dict): Arguments passés à la fonction décorée.

    Retour:
    - str | None: L'ID du calendrier s'il est trouvé, sinon None.
    """

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


def _extract_token(kwargs: dict) -> str | None:
    """Extrait le token des différents emplacements possibles dans la requête.

    Paramètres:
    - kwargs (dict): Arguments passés à la fonction décorée.

    Retour:
    - str | None: Le token s'il est trouvé, sinon None.
    """
    return (
        kwargs.get("token")
        or getattr(request, "view_args", {}).get("token")
        or request.args.get("token")
    )

def _verify_calendar_share(calendar_id: str, receiver_uid: str) -> bool:
    """Vérifie si un utilisateur a accès à un calendrier partagé.

    Paramètres:
    - calendar_id (str): L'ID du calendrier.
    - receiver_uid (str): L'UID de l'utilisateur receveur.

    Retour:
    - bool: True si l'utilisateur a accès au calendrier partagé, False sinon.
    """
    try:
        with get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute("""
                    WITH set_user AS (
                        SELECT set_config('request.jwt.claim.sub', %s, true)
                    )
                    SELECT
                        EXISTS (SELECT 1 FROM calendars, set_user WHERE id = %s AND deleted_at IS NULL) AS calendar_exists,
                        EXISTS (
                            SELECT 1
                            FROM shared_calendars, set_user
                            WHERE calendar_id = %s
                              AND receiver_uid = %s
                              AND deleted_at IS NULL
                              AND accepted_at IS NOT NULL
                        ) AS share_exists
                """, (receiver_uid, calendar_id, calendar_id, receiver_uid))

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
    """Vérifie si un utilisateur a accès à un calendrier.
    
    Paramètres:
    - calendar_id (str): L'ID du calendrier.
    - uid (str): L'UID de l'utilisateur.

    Retour:
    - bool: True si l'utilisateur a accès au calendrier, False sinon.
    """
    try:
        with get_connection() as conn:
            with conn.cursor() as cursor:
                # On laisse le RLS filtrer. Si une ligne est retournée, c'est que l'utilisateur a accès
                # (soit propriétaire, soit invité, soit partagé).
                cursor.execute("""
                    WITH set_user AS (
                        SELECT set_config('request.jwt.claim.sub', %s, true)
                    )
                    SELECT 1 FROM calendars, set_user WHERE id = %s AND deleted_at IS NULL
                """, (uid, calendar_id))
                return cursor.fetchone() is not None

    except Exception as e:
        logger.error("erreur lors de la vérification de l'accès au calendrier", {
            "origin": "CALENDAR_VERIFY_ERROR",
            "uid": uid,
            "calendar_id": calendar_id,
            "error": str(e)
        })
        return False

def _verify_token(token: str) -> str | bool:
    """Vérifie la validité d'un token de partage de calendrier.
    
    Paramètres:
    - token (str): Le token à vérifier.

    Retour:
    - str | bool: L'ID du calendrier si le token est valide, sinon False.
    """
    try:
        with get_connection() as conn:
            with conn.cursor() as cursor:
                # Injection du token en session pour passer le RLS de shared_tokens
                cursor.execute("""
                    WITH set_session AS (
                        SELECT set_config('app.current_token', %s, true)
                    )
                    SELECT * FROM shared_tokens, set_session WHERE id = %s AND deleted_at IS NULL
                """, (token, token))
                
                token_data = cursor.fetchone()
                if not token_data:
                    return False

                calendar_id = token_data.get("calendar_id")
                expires_at = token_data.get("expires_at")
                deleted_at = token_data.get("deleted_at")

                now = datetime.now(timezone.utc).date()

                if expires_at and now > expires_at.date():
                    return False

                if deleted_at:
                    return False

                # Tous les tokens sont en mode lecture seule
                return calendar_id

    except Exception as e:
        logger.error("erreur lors de la vérification du token", {
            "origin": "TOKEN_VERIFY_ERROR",
            "token": token,
            "error": str(e)
        })
        return False

def _verify_token_owner(token: str, uid: str) -> bool:
    """Vérifie si un utilisateur est le propriétaire d'un token de partage de calendrier.
    
    Paramètres:
    - token (str): Le token à vérifier.
    - uid (str): L'UID de l'utilisateur.

    Retour:
    - bool: True si l'utilisateur est le propriétaire du token, False sinon.
    """
    try:
        with get_connection() as conn:
            with conn.cursor() as cursor:
                # Le RLS sur shared_tokens filtre déjà par owner_uid = auth.uid()
                # Donc si on trouve la ligne, c'est que l'utilisateur est le propriétaire.
                cursor.execute("SELECT 1 FROM shared_tokens WHERE id = %s AND deleted_at IS NULL", (token,))
                return cursor.fetchone() is not None

    except Exception as e:
        logger.error("erreur lors de la vérification de la propriété du token", {
            "origin": "TOKEN_OWNER_VERIFY_ERROR",
            "token": token,
            "uid": uid,
            "error": str(e)
        })
        return False


def verify_calendar_share(calendar_id: str = None, receiver_uid: str = None) -> bool:
    """Vérifie si un utilisateur a accès à un calendrier partagé.
    
    Paramètres:
    - calendar_id (str): L'ID du calendrier.
    - receiver_uid (str): L'UID de l'utilisateur receveur.

    Retour:
    - bool: True si l'utilisateur a accès au calendrier partagé, False sinon.
    """
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


def verify_calendar(calendar_id: str = None, uid: str = None) -> bool:
    """Vérifie si un utilisateur a accès à un calendrier.
    
    Paramètres:
    - calendar_id (str): L'ID du calendrier.
    - uid (str): L'UID de l'utilisateur.

    Retour:
    - bool: True si l'utilisateur a accès au calendrier, False sinon.
    """
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


def verify_token(token: str = None) -> str | bool:
    """Vérifie la validité d'un token de partage de calendrier.

    Paramètres:
    - token (str): Le token à vérifier.

    Retour:
    - str | bool: L'ID du calendrier si le token est valide, sinon False
    - g.calendar_id (str): L'ID du calendrier extrait du token si valide.
    """
    
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


def verify_token_owner(token: str = None, uid: str = None) -> bool:
    """Vérifie si un utilisateur est le propriétaire d'un token de partage de calendrier.

    Paramètres:
    - token (str): Le token à vérifier.
    - uid (str): L'UID de l'utilisateur.
    
    Retour:
    - bool: True si l'utilisateur est le propriétaire du token, False sinon.
    """
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


def _verify_login_invite_owner(token: str, uid: str) -> dict | bool:
    """Vérifie si un utilisateur est le propriétaire d'une invitation de connexion à un calendrier partagé.
    
    Paramètres:
    - token (str): Le token à vérifier.
    - uid (str): L'UID de l'utilisateur.

    Retour:
    - dict | bool: Un dictionnaire contenant l'ID du calendrier et l'UID du destinataire si l'utilisateur est le propriétaire, sinon False.
    """
    try:
        with get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute("""
                                        SELECT sc.calendar_id, sc.receiver_uid
                                        FROM shared_calendars sc
                                        JOIN calendars c ON c.id = sc.calendar_id
                                        WHERE sc.token = %s
                                            AND c.owner_uid = %s
                                            AND sc.deleted_at IS NULL
                                            AND c.deleted_at IS NULL
                                """, (token, uid))
                row = cursor.fetchone()
                if not row:
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


def verify_login_invitation_owner(token: str = None, uid: str = None) -> dict | bool:
    """
    Vérifie si un utilisateur est le propriétaire d'une invitation de connexion à un calendrier partagé.

    Paramètres:
    - token (str): Le token à vérifier.
    - uid (str): L'UID de l'utilisateur.

    Retour:
    - dict | bool: Un dictionnaire contenant l'ID du calendrier et l'UID du destinataire si l'utilisateur est le propriétaire, sinon False.
    - g.calendar_id (str): L'ID du calendrier extrait du token si valide.
    - g.receiver_uid (str): L'UID du destinataire extrait du token si valide.
    """
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

def _verify_registration_invite_owner(token: str, uid: str) -> dict | bool:
    """Vérifie si un utilisateur est le propriétaire d'une invitation d'enregistrement à un calendrier partagé.
    
    Paramètres:
    - token (str): Le token à vérifier.
    - uid (str): L'UID de l'utilisateur.

    Retour:
    - dict | bool: Un dictionnaire contenant l'ID du calendrier et l'UID du destinataire si l'utilisateur est le propriétaire, sinon False.
    """
    try:
        with get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute("""
                                        SELECT i.calendar_id, i.invited_email
                                        FROM invitations i
                                        JOIN calendars c ON c.id = i.calendar_id
                                        WHERE i.token = %s
                                            AND c.owner_uid = %s
                                            AND i.deleted_at IS NULL
                                            AND c.deleted_at IS NULL
                                """, (token, uid))
                row = cursor.fetchone()
                if not row:
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


def verify_registration_invitation_owner(token: str = None, uid: str = None) -> dict | bool:
    """Vérifie si un utilisateur est le propriétaire d'une invitation d'enregistrement à un calendrier partagé.

    Paramètres:
    - token (str): Le token à vérifier.
    - uid (str): L'UID de l'utilisateur.

    Retour:
    - dict | bool: Un dictionnaire contenant l'ID du calendrier et l'UID du destinataire si l'utilisateur est le propriétaire, sinon False.
    - g.calendar_id (str): L'ID du calendrier extrait du token si valide.
    - g.invited_email (str): L'email invité extrait du token si valide.
    """
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


def _verify_login_invite_receiver(token: str, uid: str) -> dict | bool:
    """Vérifie si un utilisateur est le destinataire d'une invitation de connexion à un calendrier partagé.

    Paramètres:
    - token (str): Le token à vérifier.
    - uid (str): L'UID de l'utilisateur.

    Retour:
    - dict | bool: Un dictionnaire contenant l'ID du calendrier, l'UID du propriétaire, 
                   et l'état d'acceptation si l'utilisateur est le destinataire, sinon False.
    """
    try:
        with get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute("""
                                        SELECT sc.calendar_id, sc.accepted_at, c.owner_uid
                                        FROM shared_calendars sc
                                        JOIN calendars c ON c.id = sc.calendar_id
                                        WHERE sc.token = %s
                                            AND sc.receiver_uid = %s
                                            AND sc.deleted_at IS NULL
                                            AND c.deleted_at IS NULL
                                """, (token, uid))
                row = cursor.fetchone()
                if not row:
                    return False

                return {
                    "calendar_id": row.get("calendar_id"),
                    "owner_uid": row.get("owner_uid"),
                    "accepted": row.get("accepted_at") is not None,
                }

    except Exception as e:
        logger.error("erreur lors de la vérification du login invite receiver", {
            "origin": "LOGIN_INVITE_RECEIVER_VERIFY_ERROR",
            "token": token,
            "uid": uid,
            "error": str(e)
        })
        return False


def verify_login_invitation_receiver(token: str = None, uid: str = None) -> dict | bool:
    """Vérifie si un utilisateur est le destinataire d'une invitation de connexion à un calendrier partagé.

    Paramètres:
    - token (str): Le token à vérifier.
    - uid (str): L'UID de l'utilisateur.

    Retour:
    - dict | bool: Un dictionnaire contenant l'ID du calendrier, l'UID du propriétaire, 
      et l'état d'acceptation si l'utilisateur est le destinataire, sinon False.
    - g.calendar_id (str): L'ID du calendrier extrait du token si valide.
    - g.owner_uid (str): L'UID du propriétaire extrait du token si valide.
    - g.invitation_accepted (bool): L'état d'acceptation de l'invitation extrait du token si valide.
    """
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
