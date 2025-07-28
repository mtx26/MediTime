from . import api
from flask import request, g
from app.utils.auth import require_auth
from app.utils.responses import success_response, error_response, warning_response
from app.vertex.gemini import analyze_medical_document
import time

@api.route("/documents/analyze", methods=["POST"])
@require_auth
def handle_analyze_medical_document():
    try:
        t_0 = time.time()
        uid = g.uid

        base64_image = request.json.get("image")

        if not base64_image:
            return warning_response(
                message="image manquante",
                code="DOCUMENT_ANALYZE_ERROR",
                status_code=400,
                uid=uid,
                origin="DOCUMENT_ANALYZE"
            )

        analysis_result = analyze_medical_document(base64_image)

        if "error" in analysis_result:
            return error_response(
                message=analysis_result["error"],
                code="DOCUMENT_ANALYZE_GEMINI_ERROR",
                status_code=500,
                uid=uid,
                origin="DOCUMENT_ANALYZE",
                error="Erreur lors de l'analyse du document médical avec Gemini"
            )

        t_1 = time.time()

        return success_response(
            message="document médical analysé avec succès",
            code="DOCUMENT_ANALYZE_SUCCESS",
            uid=uid,
            origin="DOCUMENT_ANALYZE",
            data={"analysis": analysis_result},
            log_extra={"time": round(t_1 - t_0, 3)}
        )

    except Exception as e:
        return error_response(
            message="erreur interne lors de l'analyse du document médical",
            code="DOCUMENT_ANALYZE_INTERNAL_ERROR",
            status_code=500,
            uid=g.uid,
            origin="DOCUMENT_ANALYZE",
            error=str(e)
        )
