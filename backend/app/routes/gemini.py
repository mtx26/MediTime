from . import api
from flask import request, g
from app.utils import require_auth
from app.utils.responses import success_response, error_response, warning_response
from app.vertex.gemini import analyze_medical_document
from app.utils import measure_time
from app.utils import with_query_origin
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
                message="Liste 'boxes' manquante ou vide",
                code="DOCUMENT_ANALYZE_SAVE_BAD_REQUEST",
                status_code=400,
            )

        calendar_id = save_analysis_result(owner_uid, calendar_name, boxes)
        
        return success_response(
            message="Résultat de l'analyse enregistré avec succès",
            code="DOCUMENT_ANALYZE_SAVE_SUCCESS",
            data={"calendar_id": calendar_id}
        )
    except Exception as e:
        return error_response(
            message="Erreur lors de l'enregistrement du résultat de l'analyse",
            code="DOCUMENT_ANALYZE_SAVE_ERROR",
            status_code=500,
            error=str(e)
        )
