from functools import wraps
from flask import request, jsonify, g
from firebase_admin import auth as firebase_auth
from app.utils.logging import log_backend as logger


def decode_token(token):
    """Vérifie et décode un token Firebase. Retourne le payload ou None."""
    if not token:
        return None

    try:
        return firebase_auth.verify_id_token(token)
    except firebase_auth.ExpiredIdTokenError:
        logger.warning("Token expiré", {"origin": "TOKEN_ERROR", "uid": "unknown"})
    except firebase_auth.InvalidIdTokenError:
        logger.warning("Token invalide", {"origin": "TOKEN_ERROR", "uid": "unknown"})
    except Exception as e:
        logger.warning("Erreur lors de la vérification du token", {
            "origin": "TOKEN_ERROR",
            "uid": "unknown",
            "error": str(e)
        })
    return None


def require_auth(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        auth_header = request.headers.get("Authorization", "")
        token = auth_header.split(" ")[1] if " " in auth_header else auth_header

        user = decode_token(token)
        if not user:
            return jsonify({"error": "Token invalide", "code": "TOKEN_INVALID"}), 401

        g.user = user
        g.uid = user.get("uid") or user.get("sub")
        return f(*args, **kwargs)

    return decorated_function
