import hashlib
import threading
import time
from collections import OrderedDict
from functools import wraps
from flask import request, jsonify, g
import requests
from app.config.config import Config
from app.utils.logging import log_backend as logger


# Cache mémoire des jetons déjà validés.
# Sans lui, chaque requête authentifiée déclenche un aller-retour HTTP vers Supabase Auth :
# la latence de l'API est alors bornée par celle de Supabase, et une indisponibilité côté
# Auth met toute l'API hors service. Le TTL est court pour que révocations et déconnexions
# soient prises en compte rapidement.
# Le cache est local au process : avec plusieurs workers gunicorn, chacun a le sien.
_token_cache: "OrderedDict[str, tuple[float, dict]]" = OrderedDict()
_token_cache_lock = threading.Lock()


def _token_cache_key(token: str) -> str:
    """Hache le jeton pour ne jamais conserver de JWT brut en mémoire cache."""
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def _cache_get(token: str) -> dict | None:
    ttl = Config.AUTH_TOKEN_CACHE_TTL
    if ttl <= 0:
        return None

    key = _token_cache_key(token)
    now = time.monotonic()
    with _token_cache_lock:
        entry = _token_cache.get(key)
        if not entry:
            return None
        expires_at, user = entry
        if expires_at <= now:
            del _token_cache[key]
            return None
        _token_cache.move_to_end(key)
        return user


def _cache_set(token: str, user: dict) -> None:
    ttl = Config.AUTH_TOKEN_CACHE_TTL
    if ttl <= 0:
        return

    key = _token_cache_key(token)
    with _token_cache_lock:
        _token_cache[key] = (time.monotonic() + ttl, user)
        _token_cache.move_to_end(key)
        while len(_token_cache) > Config.AUTH_TOKEN_CACHE_MAX_SIZE:
            _token_cache.popitem(last=False)


def decode_token(token: str) -> dict | None:
    """Vérifie un token JWT Supabase via le serveur Auth et retourne l'utilisateur ou None.
    
    Selon la doc Supabase pour les clés HS256:
    https://supabase.com/docs/guides/auth/jwts#verifying-with-the-legacy-jwt-secret-or-a-shared-secret-signing-key

    Paramètres:
    - token (str): Le token JWT à vérifier.

    Retour:
    - dict | None: Données utilisateur ou None si invalide.
    """
    if not token:
        return None

    cached = _cache_get(token)
    if cached is not None:
        return cached

    try:
        # Vérification via le serveur Auth Supabase (méthode recommandée pour HS256)
        response = requests.get(
            f"{Config.SUPABASE_URL}/auth/v1/user",
            headers={
                "Authorization": f"Bearer {token}",
                "apikey": Config.SUPABASE_ANON_KEY
            },
            timeout=5
        )
        
        if response.status_code == 200:
            user_data = response.json()
            # Retourne le payload compatible avec l'ancien format
            user = {
                "sub": user_data.get("id"),
                "email": user_data.get("email"),
                "phone": user_data.get("phone"),
                "role": user_data.get("role", "authenticated"),
                "aud": "authenticated",
                **user_data
            }
            # On ne met en cache qu'un jeton effectivement rattaché à un utilisateur :
            # sans 'sub', g.uid serait None et get_connection échouerait plus loin.
            if user.get("sub"):
                _cache_set(token, user)
            return user
        else:
            logger.warning("Token invalide (Auth server)", {
                "origin": "TOKEN_ERROR",
                "uid": "unknown",
                "status": response.status_code
            })
            return None
            
    except requests.exceptions.Timeout:
        logger.error("Timeout lors de la vérification du token", {"origin": "TOKEN_ERROR"})
        return None
    except requests.exceptions.RequestException as e:
        logger.error("Erreur réseau lors de la vérification du token", {
            "origin": "TOKEN_ERROR",
            "error": str(e)
        })
        return None
    except Exception as e:
        logger.warning("Erreur lors de la vérification du token", {
            "origin": "TOKEN_ERROR",
            "uid": "unknown",
            "error": str(e)
        })
        return None


def require_auth(f):
    """Décorateur pour exiger l'authentification via un token JWT Supabase.

    Paramètres:
    - f: Fonction à décorer.

    Retour:
    - Fonction décorée.
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        auth_header = request.headers.get("Authorization", "").strip()
        scheme, _, value = auth_header.partition(" ")
        token = value.strip() if scheme.lower() == "bearer" else auth_header

        user = decode_token(token)
        # Un utilisateur sans 'sub' ne permet pas d'établir le contexte RLS :
        # on refuse plutôt que de laisser g.uid à None en aval.
        if not user or not user.get("sub"):
            return jsonify({"error": "Token invalide", "code": "TOKEN_INVALID"}), 401

        g.user = user
        g.uid = user.get("sub")
        return f(*args, **kwargs)

    return decorated_function
