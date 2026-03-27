from app.db.connection import get_connection
from app.utils.logging import log_backend
from app.services.medication import check_low_stock_and_notify_for_calendar
from datetime import timedelta, datetime

def send_notifications_for_all_users():
    """Vérifie et envoie les notifications aux utilisateurs dont l'heure de notification est proche."""
    try:
        # Récupérer l'heure actuelle (datetime complet pour les calculs)
        now = datetime.now()
        
        # Calculer la fenêtre de ±15 minutes
        start_datetime = now - timedelta(minutes=15)
        end_datetime = now + timedelta(minutes=15)
        start_time = start_datetime.time()
        end_time = end_datetime.time()
        
        with get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute("""
                    SELECT id
                    FROM users
                    WHERE deleted_at IS NULL
                    AND notification_time > %s 
                    AND notification_time <= %s
                """, (start_time, end_time))
                rows = cursor.fetchall()
                user_ids = [row["id"] for row in rows]
        
        i = 0
        for user_id in user_ids:
           i += send_notification(user_id)
           
        log_backend.info(
            f"Notifications de stock faible envoyées pour {i} calendrier(s)",
            {
                "origin": "STOCK",
                "code": "STOCK_NOTIFICATION_SENT",
                "user_ids": user_ids,
            }
        )
    except Exception as e:
        log_backend.error(
            "Erreur lors de la récupération des utilisateurs pour les notifications",
            {
                "origin": "STOCK",
                "code": "STOCK_NOTIFICATION_USER_FETCH_ERROR",
                "error": str(e),
            }
        )

def send_notification(user_id):
    """Envoie les notifications de stock faible pour tous les calendriers d'un utilisateur."""
    try:
        with get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute("""
                    SELECT id
                    FROM calendars
                    WHERE owner_uid = %s 
                    AND deleted_at IS NULL
                """, (user_id,))
                calendars = cursor.fetchall()
        
        if not calendars:
            log_backend.info(
                f"Aucun calendrier trouvé pour l'utilisateur {user_id}",
                {
                    "origin": "NOTIFICATION",
                    "code": "NO_CALENDARS_FOUND",
                    "user_id": str(user_id)
                }
            )
            return
            
        # Envoyer les notifications pour chaque calendrier
        for calendar in calendars:
            calendar_id = calendar["id"]
            check_low_stock_and_notify_for_calendar(calendar_id, ["push"])
        
        return len(calendars)
            
    except Exception as e:
        log_backend.error(
            "Erreur lors de l'envoi des notifications de stock faible",
            {
                "origin": "NOTIFICATION",
                "code": "STOCK_NOTIFICATION_ERROR",
                "user_id": str(user_id),
                "error": str(e),
            }
        )