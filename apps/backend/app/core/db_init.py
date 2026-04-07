# app/core/db_init.py
"""
Configuration et vérification de la connexion DB partagée entre l'API et le scheduler.
"""

from app.db.connection import get_connection
from app.utils.logging import log_backend

def verify_db_connection():
    """Vérifie la connexion à la base de données PostgreSQL.
    
    Returns:
        bool: True si la connexion fonctionne, False sinon.
    """
    try:
        with get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute("SELECT 1")
                result = cursor.fetchone()
                
        log_backend.info("Connexion DB vérifiée avec succès", {
            "origin": "DB_INIT",
            "code": "DB_CONNECTION_SUCCESS"
        })
        return True
        
    except Exception as e:
        log_backend.error("Erreur lors de la vérification de la connexion DB", {
            "origin": "DB_INIT",
            "code": "DB_CONNECTION_ERROR",
            "error": str(e)
        })
        return False
