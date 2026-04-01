# app/config/config.py

import os
from dotenv import load_dotenv

load_dotenv()  # Charge les variables du fichier .env

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

    # Email
    SMTP_HOST = os.getenv("SMTP_HOST")
    SMTP_PORT = os.getenv("SMTP_PORT")
    NOTIFICATION_EMAIL_ADDRESS = os.getenv("NOTIFICATION_EMAIL_ADDRESS")
    NOTIFICATION_EMAIL_PASSWORD = os.getenv("NOTIFICATION_EMAIL_PASSWORD")

    # SMS
    TWILIO_API_KEY_SID = os.getenv("TWILIO_API_KEY_SID")
    TWILIO_API_KEY_SECRET = os.getenv("TWILIO_API_KEY_SECRET")
    TWILIO_MESSAGING_SERVICE_SID = os.getenv("TWILIO_MESSAGING_SERVICE_SID")