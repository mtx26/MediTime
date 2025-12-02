# db.py
import psycopg2
from psycopg2.extras import RealDictCursor
from app.config import Config

def get_connection() -> psycopg2.extensions.connection:
    """Établit une connexion à la base de données Supabase PostgreSQL.

    Retour:
    - psycopg2.extensions.connection: Objet de connexion à la base de données.
    """

    return psycopg2.connect(
        host=Config.SUPABASE_DB_HOST,
        dbname=Config.SUPABASE_DB_NAME,
        user=Config.SUPABASE_DB_USER,
        password=Config.SUPABASE_DB_PASSWORD,
        port=Config.SUPABASE_DB_PORT,
        sslmode="require",
        cursor_factory=RealDictCursor
    )
