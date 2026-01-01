from functools import wraps
from flask import request, jsonify, g
import requests
from app.config.config import Config
from app.utils.logging import log_backend as logger


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
            return {
                "sub": user_data.get("id"),
                "email": user_data.get("email"),
                "phone": user_data.get("phone"),
                "role": user_data.get("role", "authenticated"),
                "aud": "authenticated",
                **user_data
            }
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
        auth_header = request.headers.get("Authorization", "")
        token = auth_header.split(" ")[1] if " " in auth_header else auth_header

        user = decode_token(token)
        if not user:
            return jsonify({"error": "Token invalide", "code": "TOKEN_INVALID"}), 401

        g.user = user
        g.uid = user.get("sub")
        return f(*args, **kwargs)

    return decorated_function
