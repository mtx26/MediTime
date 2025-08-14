# app/utils/context.py
from functools import wraps
from flask import g, request
import time

def with_query_origin(default_origin: str | None = None):
    """
    - Lit ?origin=... depuis la query string et le place dans g.origin.
    - Si absent, prend default_origin si fourni.
    - Ne touche pas à g.uid (déjà posé par @require_auth).
    - Garantit g._t0 (si @measure_time n'a pas encore initialisé).
    """
    def decorator(f):
        @wraps(f)
        def wrapped(*args, **kwargs):
            if not hasattr(g, "_t0"):
                g._t0 = time.perf_counter()
            g.origin = request.args.get("origin") or default_origin or getattr(g, "origin", None)
            return f(*args, **kwargs)
        return wrapped
    return decorator
