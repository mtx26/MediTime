# app/core/firebase_init.py
"""
Initialisation Firebase partagée entre l'API et le scheduler.
"""

import firebase_admin
from firebase_admin import credentials
from app.auth.google_services import get_google_credentials
from app.utils.logging import log_backend

# Instance globale Firebase
_firebase_initialized = False

def init_firebase():
    """Initialise Firebase avec les credentials de l'env.
    
    Peut être appelée plusieurs fois sans erreur (idempotente).
    """
    global _firebase_initialized
    
    if _firebase_initialized or firebase_admin._apps:
        log_backend.info("Firebase déjà initialisé", {
            "origin": "FIREBASE_INIT",
            "code": "FIREBASE_INIT_ALREADY_INITIALIZED"
        })
        return

    try:
        service_account_dict, project_id = get_google_credentials()

        if not service_account_dict:
            raise RuntimeError("Impossible de récupérer les credentials Firebase")

        cred = credentials.Certificate(service_account_dict)
        firebase_admin.initialize_app(cred)
        
        _firebase_initialized = True
        
        log_backend.info("Firebase initialisé avec succès", {
            "origin": "FIREBASE_INIT",
            "code": "FIREBASE_INIT_SUCCESS",
            "project_id": project_id
        })
        
    except Exception as e:
        log_backend.error("Erreur lors de l'initialisation de Firebase", {
            "origin": "FIREBASE_INIT",
            "code": "FIREBASE_INIT_ERROR",
            "error": str(e)
        })
        raise RuntimeError("Initialisation Firebase échouée")
