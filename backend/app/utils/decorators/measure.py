# app/utils/measure.py (inchangé ou juste g._t0 au début)
import time
from functools import wraps
from flask import g

def measure_time():
    """Décorateur pour mesurer le temps d'exécution d'une fonction et stocker dans g.elapsed_time.

    Retour:
    - g.elapsed_time (float): Temps écoulé en secondes, arrondi à 6 décimales.
    """
    def decorator(f):
        @wraps(f)
        def wrapped(*args, **kwargs):
            if not hasattr(g, "_t0"):
                g._t0 = time.perf_counter()
            try:
                return f(*args, **kwargs)
            finally:
                g.elapsed_time = round(time.perf_counter() - g._t0, 6)
        return wrapped
    return decorator

def elapsed_now():
    if hasattr(g, "_t0"):
        return round(time.perf_counter() - g._t0, 6)
    return None
