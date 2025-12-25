from . import api
from flask import request, g
from app.utils.responses import success_response, error_response, warning_response
from app.vertex.gemini import analyze_medical_document
from app.utils.decorators import measure_time, with_query_origin, require_auth
from app.services.documents import save_analysis_result

@api.route("/documents/analyze", methods=["POST"])
@measure_time()
@require_auth
@with_query_origin(default_origin="DOCUMENT_ANALYZE")
def handle_analyze_medical_document():
    """Analyse un document médical en utilisant le modèle Gemini.

    Payload:
    - str: Image encodée en base64 du document médical à analyser.
    """
    try:
        base64_image = request.json.get("image")

        if not base64_image:
            return warning_response(
                message="missing image",
                code="DOCUMENT_ANALYZE_ERROR",
                i18n_key="api.ai.missing_image",
                status_code=400,
            )

        analysis_result = analyze_medical_document(base64_image)

        if not analysis_result:
            return error_response(
                message="Error during the analysis of the medical document with Gemini",
                code="DOCUMENT_ANALYZE_GEMINI_ERROR",
                i18n_key="api.ai.analyze_error",
                status_code=500,
                error="Erreur lors de l'analyse du document médical avec Gemini"
            )

        return success_response(
            message="medical document successfully analyzed",
            code="DOCUMENT_ANALYZE_SUCCESS",
            i18n_key="api.ai.analyze_success",
            data={"medicines": analysis_result}
        )

    except Exception as e:
        return error_response(
            message="internal error during the analysis of the medical document",
            code="DOCUMENT_ANALYZE_INTERNAL_ERROR",
            i18n_key="api.ai.internal_error",
            status_code=500,
            error=str(e)
        )

@api.route("/documents/analyze/save", methods=["POST"])
@measure_time()
@require_auth
@with_query_origin(default_origin="DOCUMENT_ANALYZE_SAVE")
def handle_save_analysis_result():
    """Enregistre le résultat de l'analyse d'un document médical dans un calendrier.

    Payload:
    - str: calendarName - Nom du calendrier où enregistrer le résultat.
    - list: boxes - Liste des boîtes contenant les informations extraites du document médical.
    """
    try:
        owner_uid = g.uid
        payload = request.get_json(force=True) or {}

        calendar_name = payload.get("calendarName")
        if not calendar_name:
            calendar_name = "Calendrier (analyse)"

        boxes = payload.get("boxes")
        if not isinstance(boxes, list) or not boxes:
            return warning_response(
                message="List of 'boxes' missing or empty",
                code="DOCUMENT_ANALYZE_SAVE_BAD_REQUEST",
                i18n_key="api.ai.save_list_warning",
                status_code=400,
            )

        calendar_id = save_analysis_result(owner_uid, calendar_name, boxes)
        
        return success_response(
            message="Analysis result successfully recorded",
            code="DOCUMENT_ANALYZE_SAVE_SUCCESS",
            i18n_key="api.ai.save_result",
            data={"calendar_id": calendar_id}
        )
    except Exception as e:
        return error_response(
            message="Error saving analysis results",
            code="DOCUMENT_ANALYZE_SAVE_ERROR",
            i18n_key="api.ai.save_error",
            status_code=500,
            error=str(e)
        )
