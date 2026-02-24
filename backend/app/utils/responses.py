# app/utils/responses.py
from flask import jsonify, g
from app.utils.logging import log_backend as logger
import time

def _merge_log_extra(log_extra: dict | None = None) -> dict:
    """Ajoute des informations par défaut au log_extra fourni.

    Paramètres:
    - log_extra (dict | None): Dictionnaire d'informations supplémentaires pour le log.

    Retour:
    - dict: Dictionnaire fusionné avec les informations par défaut.
    """
    log_extra = dict(log_extra or {})
    # Optionnel : extra par défaut posé ailleurs, ex. via un autre décorateur
    default_extra = getattr(g, "default_log_extra", {})
    log_extra = {**default_extra, **log_extra}
    # Temps d'exécution si @measure_time a initialisé g._t0
    if "time" not in log_extra and hasattr(g, "_t0"):
        log_extra["time"] = round(time.perf_counter() - g._t0, 6)
    return log_extra

def _defaults(uid: str | None = None, origin: str | None = None) -> tuple[str | None, str | None]:
    """Récupère les valeurs par défaut pour uid et origin depuis le contexte global Flask (g).

    Paramètres:
    - uid (str | None): UID fourni explicitement.
    - origin (str | None): Origine fournie explicitement.

    Retour:
    - tuple[str | None, str | None]: Tuple contenant l'UID et l'origine
    - g.uid (str | None): UID depuis g si non fourni.
    - g.origin (str | None): Origine depuis g si non fournie.
    """
    return (
        uid if uid is not None else getattr(g, "uid", None),
        origin if origin is not None else getattr(g, "origin", None),
    )

# exemple de log_extra : {'calendar_id': '...', 'token': '...'}

def success_response(
    message: str,
    code: str,
    uid: str | None = None,
    origin: str | None = None,
    data: dict | None = None,
    log_extra: dict | None = None,
    i18n_key: str | None = None
) -> tuple:
    """Retourne une réponse JSON de succès avec journalisation.

    Paramètres:
    - message (str): Message de succès.
    - code (str): Code de succès.
    - uid (str | None): UID de l'utilisateur.
    - origin (str | None): Origine de la requête.
    - data (dict | None): Données supplémentaires à inclure dans la réponse.
    - log_extra (dict | None): Informations supplémentaires pour le log.
    - i18n_key (str | None): Clé i18n pour la traduction du message.

    Retour:
    - tuple: Tuple contenant la réponse JSON et le code HTTP.
    """
    uid, origin = _defaults(uid, origin)
    payload = {"message": message, "code": code}
    if i18n_key:
        payload["i18n_key"] = i18n_key

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

def error_response(
    message: str,
    code: int | str,
    status_code: int = 500,
    uid: str | None = None,
    origin: str | None = None,
    error: Exception | str | None = None,
    log_extra: dict | None = None,
    i18n_key: str | None = None
) -> tuple:
    """Retourne une réponse JSON d'erreur avec journalisation.

    Paramètres:
    - message (str): Message d'erreur.
    - code (str): Code d'erreur.
    - status_code (int): Code HTTP de la réponse.
    - uid (str | None): UID de l'utilisateur.
    - origin (str | None): Origine de la requête.
    - error (Exception | None): Exception associée à l'erreur.
    - log_extra (dict | None): Informations supplémentaires pour le log.
    - i18n_key (str | None): Clé i18n pour la traduction du message.

    Retour:
    - tuple: Tuple contenant la réponse JSON et le code HTTP.
    """
    uid, origin = _defaults(uid, origin)
    payload = {"error": message, "code": code, "details": str(error) if error is not None else None}
    if i18n_key:
        payload["i18n_key"] = i18n_key

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

def warning_response(
    message: str,
    code: str,
    status_code: int = 400,
    uid: str | None = None,
    origin: str | None = None,
    log_extra: dict | None = None,
    i18n_key: str | None = None
) -> tuple:
    """Retourne une réponse JSON d'avertissement avec journalisation.

    Paramètres:
    - message (str): Message d'avertissement.
    - code (str): Code d'avertissement.
    - status_code (int): Code HTTP de la réponse.
    - uid (str | None): UID de l'utilisateur.
    - origin (str | None): Origine de la requête.
    - log_extra (dict | None): Informations supplémentaires pour le log.
    - i18n_key (str | None): Clé i18n pour la traduction du message.

    Retour:
    - tuple: Tuple contenant la réponse JSON et le code HTTP.
    """
    uid, origin = _defaults(uid, origin)
    payload = {"error": message, "code": code}
    if i18n_key:
        payload["i18n_key"] = i18n_key

    merged_extra = _merge_log_extra(log_extra)
    merged_extra["code"] = code

    if origin and uid:
        logger.warning(message, {
            "origin": origin,
            "uid": uid,
            **merged_extra
        })

    return jsonify(payload), status_code
