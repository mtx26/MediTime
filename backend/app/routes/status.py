from flask import request
from . import api
from app.utils.logging import log_backend as logger
from app.utils.responses import success_response

@api.route('/status', methods=['GET', 'HEAD'])
def status():
    if request.method == 'HEAD':
        logger.info(
            "requête HEAD reçue",
            {"origin": "STATUS", "code": "STATUS_CHECK_HEAD"},
        )
        return "", 200

    logger.info(
        "requête GET reçue",
        {"origin": "STATUS", "code": "STATUS_CHECK_GET"},
    )

    return success_response(
        message="statut ok",
        code="STATUS_CHECK_SUCCESS",
        origin="STATUS",
    )
