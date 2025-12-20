from flask import Response, g
from . import api
import requests
from app.db.connection import get_connection
from app.utils.responses import error_response
from app.utils.decorators import measure_time, with_query_origin, elapsed_now
from app.utils.logging import log_backend


@api.route("/proxy/pdf/<box_id>", methods=["GET"])
@measure_time()
@with_query_origin(default_origin="PDF_PROXY")
def proxy_pdf(box_id):
    try:
        if not box_id:
            return error_response(
                message="box_id manquant",
                code="MISSING_BOX_ID",
                status_code=400,
            )

        # Connexion sans RLS car cette route est publique/sans auth
        with get_connection(skip_rls=True) as conn:
            with conn.cursor() as cursor:
                cursor.execute("""
                    SELECT ma.url_notice_fr
                    FROM medicine_boxes mb
                    LEFT JOIN medicaments_afmps ma
                      ON ma.name ILIKE CONCAT('%%', mb.name, '%%')
                     AND ma.dose ILIKE CONCAT('%%', mb.dose, '%%')
                                        WHERE mb.id = %s
                                            AND mb.deleted_at IS NULL
                """, (box_id,))
                url_result = cursor.fetchone()

        if not url_result or not url_result.get("url_notice_fr"):
            return error_response(
                message="URL non trouvée",
                code="URL_NOT_FOUND",
                status_code=404,
            )

        r = requests.get(url_result["url_notice_fr"], stream=True, timeout=10)
        r.raise_for_status()

        log_backend.info(
            "PDF téléchargé",
            {
                "origin": g.origin,
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
            error=str(e)
        )
