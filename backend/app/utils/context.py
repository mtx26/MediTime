# app/utils/context.py
from functools import wraps
from flask import g, request
import time

def with_query_origin(default_origin: str | None = None):
    """Décorateur pour extraire le paramètre de requête 'origin' et le stocker dans le contexte global Flask (g).
    
    Paramètres:
    - default_origin (str | None): Valeur par défaut pour 'origin' si non présente dans la requête.

    Retour:
    - g.origin (str | None): Valeur de l'origine extraite ou par défaut.
    """
    def decorator(f):
        @wraps(f)
        def wrapped(*args, **kwargs):
            g.origin = request.args.get("origin") or default_origin or getattr(g, "origin", None)
            return f(*args, **kwargs)
        return wrapped
    return decorator
