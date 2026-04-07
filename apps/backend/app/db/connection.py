# db.py
import psycopg2
from psycopg2.extras import RealDictCursor
from psycopg2 import pool
from app.config import Config
from flask import g, has_request_context
from contextlib import contextmanager

# Connection pool pour réutiliser les connexions (améliore les perfs)
_connection_pool = None

def _get_pool():
    """Retourne le pool de connexions, le crée si nécessaire."""
    global _connection_pool
    if _connection_pool is None:
        _connection_pool = pool.ThreadedConnectionPool(
            minconn=1,
            maxconn=10,  # 10 pour Flask dev (single-process), 5 suffit en prod avec Gunicorn multi-workers
            host=Config.SUPABASE_DB_HOST,
            dbname=Config.SUPABASE_DB_NAME,
            user=Config.SUPABASE_DB_USER,
            password=Config.SUPABASE_DB_PASSWORD,
            port=Config.SUPABASE_DB_PORT,
            sslmode="require",
            cursor_factory=RealDictCursor
        )
    return _connection_pool

@contextmanager
def get_connection(uid: str = None, skip_rls: bool = False):
    """Context manager pour gérer une connexion à la base de données Supabase PostgreSQL depuis le pool.

    Paramètres:
    - uid (str, optionnel): L'ID de l'utilisateur pour le contexte RLS.
                            Si non fourni, tente de récupérer g.uid du contexte Flask.
    - skip_rls (bool, optionnel): Si True, ignore le contexte utilisateur et utilise la connexion admin (sans RLS).

    Utilisation:
    with get_connection() as conn:
        with conn.cursor() as cursor:
            cursor.execute("SELECT ...")
    """

    # Récupérer une connexion du pool
    connection_pool = _get_pool()
    conn = connection_pool.getconn()

    try:
        # Si on demande explicitement de sauter le RLS, on retourne la connexion telle quelle (Admin)
        if not skip_rls:
            # Déterminer l'UID à utiliser (paramètre explicite ou contexte global)
            target_uid = uid
            if target_uid is None and has_request_context() and hasattr(g, 'uid'):
                target_uid = g.uid

            if target_uid:
                with conn.cursor() as cursor:
                    # Définit l'utilisateur courant pour les politiques RLS
                    cursor.execute("SET request.jwt.claim.sub = %s", (target_uid,))
                    # Bascule vers le rôle 'authenticated' pour que RLS s'applique
                    cursor.execute("SET ROLE authenticated")
        
        yield conn
        # Commit automatique si tout s'est bien passé
        conn.commit()
    except Exception as e:
        # Rollback en cas d'erreur
        conn.rollback()
        raise e
    finally:
        # IMPORTANT: Rendre la connexion au pool après utilisation
        connection_pool.putconn(conn)