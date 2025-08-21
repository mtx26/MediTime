from . import api
from flask import request, g
from app.utils import require_auth
from app.utils.responses import success_response, error_response, warning_response
from app.vertex.gemini import analyze_medical_document
from app.utils import measure_time
from app.utils import with_query_origin

@api.route("/documents/analyze", methods=["POST"])
@measure_time()
@require_auth
@with_query_origin(default_origin="DOCUMENT_ANALYZE")
def handle_analyze_medical_document():
    try:
        uid = g.uid if hasattr(g, "uid") else None

        base64_image = request.json.get("image")

        if not base64_image:
            return warning_response(
                message="image manquante",
                code="DOCUMENT_ANALYZE_ERROR",
                status_code=400,
            )

        analysis_result = analyze_medical_document(base64_image)

        if not analysis_result:
            return error_response(
                message="Erreur lors de l'analyse du document médical avec Gemini",
                code="DOCUMENT_ANALYZE_GEMINI_ERROR",
                status_code=500,
                error="Erreur lors de l'analyse du document médical avec Gemini"
            )

        return success_response(
            message="document médical analysé avec succès",
            code="DOCUMENT_ANALYZE_SUCCESS",
            data={"medicines": analysis_result}
        )

    except Exception as e:
        return error_response(
            message="erreur interne lors de l'analyse du document médical",
            code="DOCUMENT_ANALYZE_INTERNAL_ERROR",
            status_code=500,
            error=str(e)
        )
