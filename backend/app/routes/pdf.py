from flask import request, Response, g
import requests
from app.db.connection import get_connection
from . import api
from app.utils.responses import error_response
from app.utils.logging import log_backend
from app.utils.measure import measure_time, elapsed_now


@api.route("/proxy/pdf/<box_id>", methods=["GET"])
@measure_time()
def proxy_pdf(box_id):
    try:
        if not box_id:
            return error_response(
                message="Missing box_id",
                code="MISSING_BOX_ID",
                status_code=400,
                origin="PDF_PROXY"
            )

        with get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute("""
                    SELECT ma.url_notice_fr
                    FROM medicine_boxes mb
                    LEFT JOIN medicaments_afmps ma
                      ON ma.name ILIKE CONCAT('%%', mb.name, '%%')
                     AND ma.dose ILIKE CONCAT('%%', mb.dose, '%%')
                    WHERE mb.id = %s
                """, (box_id,))
                url_result = cursor.fetchone()

        if not url_result or not url_result.get("url_notice_fr"):
            return error_response(
                message="URL not found",
                code="URL_NOT_FOUND",
                status_code=404,
                origin="PDF_PROXY"
            )

        r = requests.get(url_result["url_notice_fr"], stream=True, timeout=10)
        r.raise_for_status()

        log_backend.info(
            "PDF downloaded",
            {
                "origin": "PDF_PROXY",
                "code": "PDF_DOWNLOADED",
                "url": url_result["url_notice_fr"],
                "time": elapsed_now()
            }
        )

        return Response(
            r.content,
            mimetype="application/pdf",
            headers={
                "Content-Disposition": "inline; filename=notice.pdf",
                "Content-Type": "application/pdf"
            }
        )

    except Exception as e:
        return error_response(
            message="Erreur lors du téléchargement du PDF",
            code="PDF_DOWNLOAD_ERROR",
            status_code=500,
            origin="PDF_PROXY",
            error=str(e)
        )
