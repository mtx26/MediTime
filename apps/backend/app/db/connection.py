# db.py
import contextvars
import json
import psycopg2
from psycopg2.extras import RealDictCursor
from psycopg2 import pool
from app.config import Config
from flask import g, has_request_context
from contextlib import contextmanager

# Connection pool pour réutiliser les connexions (améliore les perfs)
_connection_pool = None

# Marque les blocs exécutés hors requête utilisateur (scheduler, scripts d'import).
# ContextVar plutôt que variable globale : isolé par thread et par tâche asyncio,
# ce qui évite qu'une tâche APScheduler ouvre le contexte admin pour les autres.
_system_context = contextvars.ContextVar("meditime_system_context", default=False)


class RlsContextError(RuntimeError):
    """Levée quand une connexion est demandée sans contexte de sécurité explicite.

    On échoue en fermé plutôt que d'ouvrir silencieusement une connexion admin :
    une connexion sans contexte contourne entièrement les politiques RLS.
    """


@contextmanager
def system_context():
    """Déclare que le bloc courant est une tâche système, autorisée à traverser les comptes.

    Les tâches cron (baisse de stock, notifications) parcourent par nature tous les
    calendriers. Les fonctions de service qu'elles appellent utilisent get_connection()
    sans uid ; ce marqueur leur accorde le contexte admin sans avoir à propager un
    paramètre à travers toute la couche service.

    Utilisation:
    with system_context():
        decrease_stock()
    """
    token = _system_context.set(True)
    try:
        yield
    finally:
        _system_context.reset(token)


def _get_pool():
    """Retourne le pool de connexions, le crée si nécessaire."""
    global _connection_pool
    if _connection_pool is None:
        _connection_pool = pool.ThreadedConnectionPool(
            minconn=Config.DB_POOL_MIN_CONN,
            maxconn=Config.DB_POOL_MAX_CONN,
            host=Config.SUPABASE_DB_HOST,
            dbname=Config.SUPABASE_DB_NAME,
            user=Config.SUPABASE_DB_USER,
            password=Config.SUPABASE_DB_PASSWORD,
            port=Config.SUPABASE_DB_PORT,
            sslmode="require",
            cursor_factory=RealDictCursor
        )
    return _connection_pool


def _build_claims(uid: str, user: dict | None) -> str:
    """Construit le JSON de claims attendu par auth.jwt() côté Postgres.

    Les politiques RLS du schéma s'appuient sur deux sources :
    - auth.uid()  -> request.jwt.claim.sub (ou le champ 'sub' de request.jwt.claims)
    - auth.jwt()  -> request.jwt.claims (nécessaire pour les policies basées sur l'email
                     des invitations, ex. invitations.invited_email = auth.jwt() ->> 'email')

    Ne poser que request.jwt.claim.sub laisserait les policies email-based sans correspondance.
    """
    claims = {"sub": uid, "role": "authenticated"}
    if user:
        for field in ("email", "phone"):
            value = user.get(field)
            if value:
                claims[field] = value
    return json.dumps(claims)


def _apply_local_settings(cursor, settings: dict[str, str], role: str | None) -> None:
    """Applique des GUC en portée transaction (SET LOCAL) puis bascule de rôle.

    Tout est transaction-local : au COMMIT/ROLLBACK Postgres restaure l'état d'origine,
    donc la connexion retourne au pool sans identité résiduelle. C'est aussi la seule
    forme compatible avec le pooler Supabase en transaction mode (port 6543), où les
    SET de session ne survivent pas d'un statement à l'autre.
    """
    for key, value in settings.items():
        cursor.execute("SELECT set_config(%s, %s, true)", (key, value))
    if role:
        # SET LOCAL ROLE : révoqué automatiquement en fin de transaction.
        cursor.execute(f"SET LOCAL ROLE {role}")


@contextmanager
def get_connection(
    uid: str = None,
    skip_rls: bool = False,
    share_token: str = None,
    ics_token: str = None,
):
    """Context manager pour une connexion Supabase PostgreSQL issue du pool.

    Un et un seul contexte de sécurité doit être choisi :

    - get_connection()                     -> contexte utilisateur, uid lu depuis g.uid
    - get_connection(uid="...")            -> contexte utilisateur explicite (hors requête Flask)
    - get_connection(share_token="...")    -> contexte lien de partage public
    - get_connection(ics_token="...")      -> contexte flux ICS public
    - get_connection(skip_rls=True)        -> contexte admin, RLS contournée (opt-in explicite)
    - à l'intérieur d'un with system_context(): -> contexte admin pour les tâches planifiées

    Sans aucun de ces contextes, une RlsContextError est levée : on refuse d'exécuter
    une requête dont le cloisonnement n'a pas été décidé.

    Utilisation:
    with get_connection() as conn:
        with conn.cursor() as cursor:
            cursor.execute("SELECT ...")
    """

    settings: dict[str, str] = {}
    role: str | None = None

    if skip_rls or _system_context.get():
        # Contexte admin assumé : aucun GUC, aucun changement de rôle.
        # Réservé aux tâches système (scheduler, imports) et aux routes qui
        # appliquent elles-mêmes un filtre explicite.
        pass
    elif share_token:
        settings["app.current_token"] = share_token
        role = Config.DB_RLS_ANON_ROLE
    elif ics_token:
        settings["app.current_ics_token"] = ics_token
        role = Config.DB_RLS_ANON_ROLE
    else:
        target_uid = uid
        user = None
        if has_request_context():
            if target_uid is None:
                target_uid = getattr(g, "uid", None)
            user = getattr(g, "user", None)

        if not target_uid:
            raise RlsContextError(
                "get_connection() appelée sans contexte de sécurité : "
                "fournissez uid=, share_token=, ics_token=, ou skip_rls=True."
            )

        settings["request.jwt.claim.sub"] = target_uid
        settings["request.jwt.claims"] = _build_claims(target_uid, user)
        role = Config.DB_RLS_AUTHENTICATED_ROLE

    connection_pool = _get_pool()
    conn = connection_pool.getconn()

    try:
        # Une connexion issue du pool peut porter une transaction avortée ou ouverte.
        # On repart d'un état propre avant d'appliquer le contexte de sécurité.
        conn.rollback()

        if settings or role:
            with conn.cursor() as cursor:
                _apply_local_settings(cursor, settings, role)

        yield conn
        # Commit automatique si tout s'est bien passé.
        # Le COMMIT annule aussi les SET LOCAL : la connexion repart neutre.
        conn.commit()
    except Exception:
        # Rollback en cas d'erreur (annule également les SET LOCAL).
        conn.rollback()
        raise
    finally:
        # IMPORTANT: Rendre la connexion au pool après utilisation
        connection_pool.putconn(conn)
