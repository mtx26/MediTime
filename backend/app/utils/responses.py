# app/utils/responses.py
from flask import jsonify, g
from app.utils.logging import log_backend as logger
import time

def _merge_log_extra(log_extra=None):
    log_extra = dict(log_extra or {})
    # Optionnel : extra par défaut posé ailleurs, ex. via un autre décorateur
    default_extra = getattr(g, "default_log_extra", {})
    log_extra = {**default_extra, **log_extra}
    # Temps d'exécution si @measure_time a initialisé g._t0
    if "time" not in log_extra and hasattr(g, "_t0"):
        log_extra["time"] = round(time.perf_counter() - g._t0, 6)
    return log_extra

def _defaults(uid, origin):
    """
    Fallback automatique :
    - uid => g.uid si non fourni
    - origin => g.origin si non fournie
    """
    return (
        uid if uid is not None else getattr(g, "uid", None),
        origin if origin is not None else getattr(g, "origin", None),
    )

# exemple de log_extra : {'calendar_id': '...', 'token': '...'}

def success_response(message, code, uid=None, origin=None, data=None, log_extra=None):
    uid, origin = _defaults(uid, origin)
    payload = {"message": message, "code": code}

    # Rétro-compat + progressif :
    # - si data est un dict : on met payload["data"]=data ET on aplati dans payload
    # - sinon : on met juste payload["data"]=data
    if data is not None:
        payload["data"] = data
        if isinstance(data, dict):
            payload.update(data)

    merged_extra = _merge_log_extra(log_extra)
    merged_extra["code"] = code

    if origin and uid:
        logger.info(message, {
            "origin": origin,
            "uid": uid,
            **merged_extra
        })

    return jsonify(payload), 200

def error_response(message, code, status_code=500, uid=None, origin=None, error=None, log_extra=None):
    uid, origin = _defaults(uid, origin)
    payload = {"error": message, "code": code}

    merged_extra = _merge_log_extra(log_extra)
    merged_extra["code"] = code

    if origin and uid:
        logger.error(message, {
            "origin": origin,
            "uid": uid,
            "error": str(error) if error is not None else None,
            **merged_extra
        })

    return jsonify(payload), status_code

def warning_response(message, code, status_code=400, uid=None, origin=None, log_extra=None):
    uid, origin = _defaults(uid, origin)
    payload = {"error": message, "code": code}

    merged_extra = _merge_log_extra(log_extra)
    merged_extra["code"] = code

    if origin and uid:
        logger.warning(message, {
            "origin": origin,
            "uid": uid,
            **merged_extra
        })

    return jsonify(payload), status_code
