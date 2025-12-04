from flask import Response, request, g
from . import api
from app.services.ics import create_calendar_ics, create_ics_token, get_ics_tokens, delete_ics_token
from app.utils.responses import error_response, success_response
from app.utils.measure import measure_time
from app.utils import with_query_origin
from app.utils.auth import require_auth
from app.services.calendar import verify_calendar, verify_calendar_share

@api.route('/calendars/<calendar_id>/ics', methods=['POST'])
@measure_time()
@require_auth
@verify_calendar
@with_query_origin(default_origin="CREATE_ICS_TOKEN")
def create_ics_token_route(calendar_id):
    """Crée un nouveau lien de partage ICS pour le calendrier courant."""
    try:
        
        token_data = create_ics_token(calendar_id, g.uid)
        
        return success_response(
            message="Lien calendrier créé avec succès",
            code="ICS_TOKEN_CREATED",
            data=token_data
        )
    except Exception as e:
        return error_response(
            message="Erreur lors de la création du lien calendrier",
            code="ICS_TOKEN_CREATION_ERROR",
            status_code=500,
            error=str(e)
        )

@api.route('/calendars/<calendar_id>/ics', methods=['GET'])
@measure_time()
@require_auth
@verify_calendar
@with_query_origin(default_origin="LIST_ICS_TOKENS")
def list_ics_tokens_route(calendar_id):
    """Liste les liens de partage ICS actifs pour le calendrier courant."""
    try:
        tokens = get_ics_tokens(calendar_id, g.uid)
        return success_response(
            message="Liste des liens calendrier",
            code="ICS_TOKENS_LISTED",
            data={"tokens": tokens}
        )
    except Exception as e:
        return error_response(
            message="Erreur lors de la récupération des liens calendrier",
            code="ICS_TOKENS_FETCH_ERROR",
            status_code=500,
            error=str(e)
        )

@api.route('/calendars/<calendar_id>/ics/<token_id>', methods=['DELETE'])
@measure_time()
@require_auth
@verify_calendar
@with_query_origin(default_origin="DELETE_ICS_TOKEN")
def delete_ics_token_route(calendar_id, token_id):
    """Supprime un lien de partage ICS."""
    try:
        uid = g.uid
        if delete_ics_token(token_id, uid):
            return success_response(
                message="Lien calendrier supprimé",
                code="ICS_TOKEN_DELETED"
            )
        else:
            return error_response(
                message="Lien introuvable ou non autorisé",
                code="ICS_TOKEN_NOT_FOUND",
                status_code=404
            )
    except Exception as e:
        return error_response(
            message="Erreur lors de la suppression du lien calendrier",
            code="ICS_TOKEN_DELETE_ERROR",
            status_code=500,
            error=str(e)
        )

@api.route('/shared/users/calendars/<calendar_id>/ics', methods=['POST'])
@measure_time()
@require_auth
@verify_calendar_share
@with_query_origin(default_origin="CREATE_SHARED_ICS_TOKEN")
def create_shared_ics_token_route(calendar_id):
    """Crée un nouveau lien de partage ICS pour un calendrier partagé."""
    try:
        token_data = create_ics_token(calendar_id, g.uid)
        return success_response(
            message="Lien calendrier partagé créé avec succès",
            code="SHARED_ICS_TOKEN_CREATED",
            data=token_data
        )
    except Exception as e:
        return error_response(
            message="Erreur lors de la création du lien calendrier partagé",
            code="SHARED_ICS_TOKEN_CREATION_ERROR",
            status_code=500,
            error=str(e)
        )

@api.route('/shared/users/calendars/<calendar_id>/ics', methods=['GET'])
@measure_time()
@require_auth
@verify_calendar_share
@with_query_origin(default_origin="LIST_SHARED_ICS_TOKENS")
def list_shared_ics_tokens_route(calendar_id):
    """Liste les liens de partage ICS actifs pour un calendrier partagé."""
    try:
        tokens = get_ics_tokens(calendar_id, g.uid)
        return success_response(
            message="Liste des liens calendrier partagé",
            code="SHARED_ICS_TOKENS_LISTED",
            data={"tokens": tokens}
        )
    except Exception as e:
        return error_response(
            message="Erreur lors de la récupération des liens calendrier partagé",
            code="SHARED_ICS_TOKENS_FETCH_ERROR",
            status_code=500,
            error=str(e)
        )

@api.route('/shared/users/calendars/<calendar_id>/ics/<token_id>', methods=['DELETE'])
@measure_time()
@require_auth
@verify_calendar_share
@with_query_origin(default_origin="DELETE_SHARED_ICS_TOKEN")
def delete_shared_ics_token_route(calendar_id, token_id):
    """Supprime un lien de partage ICS d'un calendrier partagé."""
    try:
        uid = g.uid
        if delete_ics_token(token_id, uid):
            return success_response(
                message="Lien calendrier partagé supprimé",
                code="SHARED_ICS_TOKEN_DELETED"
            )
        else:
            return error_response(
                message="Lien introuvable ou non autorisé",
                code="SHARED_ICS_TOKEN_NOT_FOUND",
                status_code=404
            )
    except Exception as e:
        return error_response(
            message="Erreur lors de la suppression du lien calendrier partagé",
            code="SHARED_ICS_TOKEN_DELETE_ERROR",
            status_code=500,
            error=str(e)
        )

@api.route('/calendar/<token>.ics', methods=['GET'])
@measure_time()
@with_query_origin(default_origin="GET_ICS_CALENDAR")
def get_calendar_ics(token):
    """
    Route publique (protégée par token dans l'URL) pour récupérer le calendrier ICS.
    Ce lien est destiné à être ajouté dans Google Calendar, Outlook, etc.
    """
    try:
        user_agent = request.headers.get('User-Agent', 'Unknown')
        ics_content = create_calendar_ics(token, user_agent)
        return Response(
            ics_content,
            mimetype='text/calendar',
            headers={
                'Content-Disposition': f'attachment; filename=meditime_calendar.ics',
                'Cache-Control': 'no-cache, no-store, must-revalidate'
            }
        )
    except ValueError:
        return error_response(
            message="Calendrier introuvable ou token invalide",
            code="ICS_NOT_FOUND",
            status_code=404
        )
    except Exception as e:
        return error_response(
            message=f"Erreur interne lors de la génération du calendrier: {str(e)}",
            code="ICS_GENERATION_ERROR",
            status_code=500,
            error=str(e)
        )
