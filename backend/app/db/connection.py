# db.py
import psycopg2
from psycopg2.extras import RealDictCursor
from app.config import Config
from flask import g, has_request_context

def get_connection(uid: str = None, skip_rls: bool = False) -> psycopg2.extensions.connection:
    """Établit une connexion à la base de données Supabase PostgreSQL.

    Paramètres:
    - uid (str, optionnel): L'ID de l'utilisateur pour le contexte RLS.
                            Si non fourni, tente de récupérer g.uid du contexte Flask.
    - skip_rls (bool, optionnel): Si True, ignore le contexte utilisateur et utilise la connexion admin (sans RLS).

    Retour:
    - psycopg2.extensions.connection: Objet de connexion à la base de données.
    """

    conn = psycopg2.connect(
        host=Config.SUPABASE_DB_HOST,
        dbname=Config.SUPABASE_DB_NAME,
        user=Config.SUPABASE_DB_USER,
        password=Config.SUPABASE_DB_PASSWORD,
        port=Config.SUPABASE_DB_PORT,
        sslmode="require",
        cursor_factory=RealDictCursor
    )

    # Si on demande explicitement de sauter le RLS, on retourne la connexion telle quelle (Admin)
    if skip_rls:
        return conn

    # Déterminer l'UID à utiliser (paramètre explicite ou contexte global)
    target_uid = uid
    if target_uid is None and has_request_context() and hasattr(g, 'uid'):
        target_uid = g.uid

    if target_uid:
        with conn.cursor() as cursor:
            # Définit l'utilisateur courant pour les politiques RLS
            cursor.execute("SET request.jwt.claim.sub = %s", (target_uid,))
            # Bascule vers le rôle 'authenticated' pour que RLS s'applique
            # (nécessaire si l'utilisateur de connexion est un superuser/admin qui bypass RLS)
            cursor.execute("SET ROLE authenticated")
    
    return conn