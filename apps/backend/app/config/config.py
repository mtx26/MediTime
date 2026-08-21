# app/config/config.py

import os
from dotenv import load_dotenv

load_dotenv()  # Charge les variables du fichier .env


def _parse_csv_env(raw_value: str | None) -> tuple[str, ...]:
    if not raw_value:
        return ()
    return tuple(
        value.strip().rstrip('/')
        for value in raw_value.split(',')
        if value.strip()
    )


def _env_flag(name: str, default: bool = False) -> bool:
    raw = os.getenv(name)
    if raw is None:
        return default
    return raw.strip().lower() in ("1", "true", "yes", "on")


def _env_int(name: str, default: int) -> int:
    raw = os.getenv(name)
    if raw is None or not str(raw).strip():
        return default
    try:
        return int(raw)
    except ValueError:
        return default

class Config:
    """Classe de configuration pour l'application Flask.
    """
    # Environnement d'exécution
    ENVIRONMENT = os.getenv("ENVIRONMENT", os.getenv("FLASK_ENV", "development")).lower()
    IS_PRODUCTION = ENVIRONMENT in ("production", "prod")

    # Supabase (utilisé avec psycopg2)
    SUPABASE_DB_HOST = os.getenv("SUPABASE_DB_HOST")
    SUPABASE_DB_NAME = os.getenv("SUPABASE_DB_NAME")
    SUPABASE_DB_USER = os.getenv("SUPABASE_DB_USER")
    SUPABASE_DB_PASSWORD = os.getenv("SUPABASE_DB_PASSWORD")
    SUPABASE_DB_PORT = _env_int("SUPABASE_DB_PORT", 6543)  # Port 6543 = Transaction Mode (200+ connexions)

    # Pool psycopg2. Attention : la taille est PAR worker Gunicorn.
    # Total de connexions = DB_POOL_MAX_CONN x (workers API + process scheduler).
    DB_POOL_MIN_CONN = _env_int("DB_POOL_MIN_CONN", 1)
    DB_POOL_MAX_CONN = _env_int("DB_POOL_MAX_CONN", 5)

    # Rôles Postgres utilisés pour faire appliquer la RLS.
    # Mettre à vide désactive le changement de rôle (la RLS est alors contournée
    # si l'utilisateur de connexion est propriétaire des tables ou superuser).
    DB_RLS_AUTHENTICATED_ROLE = os.getenv("DB_RLS_AUTHENTICATED_ROLE", "authenticated").strip()
    DB_RLS_ANON_ROLE = os.getenv("DB_RLS_ANON_ROLE", "anon").strip()

    # Cache de vérification des jetons Supabase Auth (secondes). 0 = désactivé.
    AUTH_TOKEN_CACHE_TTL = _env_int("AUTH_TOKEN_CACHE_TTL", 30)
    AUTH_TOKEN_CACHE_MAX_SIZE = _env_int("AUTH_TOKEN_CACHE_MAX_SIZE", 2048)

    # Supabase Auth (pour vérification JWT)
    SUPABASE_URL = os.getenv("SUPABASE_URL")
    SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY")
    
    # Firebase
    GOOGLE_APPLICATION_CREDENTIALS = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
    GOOGLE_CLOUD_LOCATION = os.getenv("GOOGLE_CLOUD_LOCATION", "us-central1")
    GEMINI_MODEL_ID = os.getenv("GEMINI_MODEL_ID", "gemini-2.5-flash")

    # Cloudinary
    CLOUDINARY_CLOUD_NAME = os.getenv("CLOUDINARY_CLOUD_NAME")
    CLOUDINARY_API_KEY = os.getenv("CLOUDINARY_API_KEY")
    CLOUDINARY_API_SECRET = os.getenv("CLOUDINARY_API_SECRET")

    # Autres options
    SYSTEM_UID = os.getenv("SYSTEM_UID")

    # Frontend URL
    FRONTEND_URL = os.getenv("FRONTEND_URL")

    # Origines de développement : jamais ajoutées automatiquement en production.
    # Un localhost autorisé en prod laisse n'importe quel serveur local appeler l'API.
    _DEV_ORIGINS = ("http://localhost:3000", "http://127.0.0.1:3000")

    CORS_ALLOWED_ORIGINS = tuple(dict.fromkeys(
        origin
        for origin in (
            *((FRONTEND_URL.rstrip('/'),) if FRONTEND_URL else ()),
            *_parse_csv_env(os.getenv("CORS_ALLOWED_ORIGINS")),
            *(() if IS_PRODUCTION else _DEV_ORIGINS),
        )
        if origin
    ))
    CORS_ALLOW_HEADERS = ("Authorization", "Content-Type")
    CORS_METHODS = ("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS")

    # Email (Resend)
    RESEND_API = os.getenv("RESEND_API") or os.getenv("RESEND_API_KEY")
    RESEND_FROM_EMAIL = os.getenv("RESEND_FROM_EMAIL")
    RESEND_FROM_NAME = os.getenv("RESEND_FROM_NAME", "MediTime")
    NOTIFICATION_EMAIL_ADDRESS = os.getenv("NOTIFICATION_EMAIL_ADDRESS")

    # SMS
    TWILIO_API_KEY_SID = os.getenv("TWILIO_API_KEY_SID")
    TWILIO_API_KEY_SECRET = os.getenv("TWILIO_API_KEY_SECRET")
    TWILIO_MESSAGING_SERVICE_SID = os.getenv("TWILIO_MESSAGING_SERVICE_SID")


# Variables sans lesquelles l'application ne peut pas fonctionner correctement.
# Sans cette vérification, chaque valeur manquante tombe silencieusement à None
# et ne se manifeste qu'au premier appel en production.
REQUIRED_SETTINGS = (
    "SUPABASE_DB_HOST",
    "SUPABASE_DB_NAME",
    "SUPABASE_DB_USER",
    "SUPABASE_DB_PASSWORD",
    "SUPABASE_URL",
    "SUPABASE_ANON_KEY",
    "FRONTEND_URL",
)


class ConfigError(RuntimeError):
    """Configuration invalide ou incomplète au démarrage."""


def validate_config(strict: bool = None) -> list[str]:
    """Vérifie la configuration au démarrage.

    Paramètres:
    - strict (bool, optionnel): Si True, lève une ConfigError. Par défaut, strict en production.

    Retour:
    - list[str]: La liste des problèmes détectés.
    """
    if strict is None:
        strict = Config.IS_PRODUCTION

    problems = [
        f"{name} est manquante"
        for name in REQUIRED_SETTINGS
        if not getattr(Config, name, None)
    ]

    if not Config.CORS_ALLOWED_ORIGINS:
        problems.append(
            "CORS_ALLOWED_ORIGINS est vide : définissez FRONTEND_URL ou CORS_ALLOWED_ORIGINS"
        )

    if Config.IS_PRODUCTION:
        for origin in Config.CORS_ALLOWED_ORIGINS:
            if "localhost" in origin or "127.0.0.1" in origin:
                problems.append(f"origine CORS de développement autorisée en production : {origin}")
        if not Config.DB_RLS_AUTHENTICATED_ROLE:
            problems.append(
                "DB_RLS_AUTHENTICATED_ROLE est vide en production : "
                "la RLS ne sera pas appliquée sur les requêtes utilisateur"
            )

    if problems and strict:
        raise ConfigError("Configuration invalide :\n  - " + "\n  - ".join(problems))

    return problems
