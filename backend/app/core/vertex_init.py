# app/core/vertex_init.py
"""
Initialisation Vertex AI partagée entre l'API et le scheduler.
"""

from google.cloud import aiplatform
from app.auth.google_services import get_google_credentials
from app.utils.logging import log_backend

# Instance globale Vertex AI
_vertex_initialized = False

def init_vertex_ai():
    """Initialise Vertex AI avec les credentials de l'env.
    
    Peut être appelée plusieurs fois sans erreur (idempotente).
    """
    global _vertex_initialized
    
    if _vertex_initialized:
        log_backend.info("Vertex AI déjà initialisé", {
            "origin": "VERTEX_INIT",
            "code": "VERTEX_INIT_ALREADY_INITIALIZED"
        })
        return

    try:
        scopes = ["https://www.googleapis.com/auth/cloud-platform"]
        credentials_obj, project_id = get_google_credentials(scopes)

        if not credentials_obj:
            raise RuntimeError("Impossible de récupérer les credentials Vertex AI")

        # Ensure credentials_obj is a Credentials instance, not a dict
        if isinstance(credentials_obj, dict):
            raise RuntimeError("Expected Credentials object, got dictionary from get_google_credentials")

        aiplatform.init(
            project=project_id,
            location="europe-west1",
            credentials=credentials_obj
        )
        
        _vertex_initialized = True
        
        log_backend.info("Vertex AI initialisé avec succès", {
            "origin": "VERTEX_INIT",
            "code": "VERTEX_INIT_SUCCESS",
            "project_id": project_id
        })
        
    except Exception as e:
        log_backend.error("Erreur lors de l'initialisation de Vertex AI", {
            "origin": "VERTEX_INIT",
            "code": "VERTEX_INIT_ERROR",
            "error": str(e)
        })
        raise RuntimeError("Initialisation Vertex AI échouée")
