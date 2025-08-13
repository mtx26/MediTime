from . import api
from flask import request, g
from app.utils.auth import require_auth
from app.utils.responses import success_response, error_response, warning_response
from app.vertex.gemini import analyze_medical_document
from app.utils.measure import measure_time

@api.route("/documents/analyze", methods=["POST"])
@require_auth
@measure_time()
def handle_analyze_medical_document():
    try:
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

        return success_response(
            message="document médical analysé avec succès",
            code="DOCUMENT_ANALYZE_SUCCESS",
            uid=uid,
            origin="DOCUMENT_ANALYZE",
            data={"medicines": analysis_result}
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
