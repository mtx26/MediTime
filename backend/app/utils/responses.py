from flask import jsonify, g
from app.utils.logging import log_backend as logger
import time


def _merge_log_extra(log_extra=None):
    log_extra = dict(log_extra or {})
    if "time" not in log_extra and hasattr(g, "_t0"):
        log_extra["time"] = round(time.perf_counter() - g._t0, 6)
    return log_extra

# exemple de log_extra : {'calendar_id': '...', 'uid': '...'}

def success_response(message, code, uid=None, origin=None, data=None, log_extra=None):
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
