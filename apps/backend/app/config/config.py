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

class Config:
    """Classe de configuration pour l'application Flask.
    """
    # Supabase (utilisé avec psycopg2)
    SUPABASE_DB_HOST = os.getenv("SUPABASE_DB_HOST")
    SUPABASE_DB_NAME = os.getenv("SUPABASE_DB_NAME")
    SUPABASE_DB_USER = os.getenv("SUPABASE_DB_USER")
    SUPABASE_DB_PASSWORD = os.getenv("SUPABASE_DB_PASSWORD")
    SUPABASE_DB_PORT = os.getenv("SUPABASE_DB_PORT", 6543)  # Port 6543 = Transaction Mode (200+ connexions)
    
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
    CORS_ALLOWED_ORIGINS = tuple(dict.fromkeys(
        origin
        for origin in (
            *((FRONTEND_URL.rstrip('/'),) if FRONTEND_URL else ()),
            *_parse_csv_env(os.getenv("CORS_ALLOWED_ORIGINS")),
            "http://localhost:3000",
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
