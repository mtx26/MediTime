from app.db.connection import get_connection
from app.utils.logging import log_backend
from app.services.medication import check_low_stock_and_notify_for_calendar
from datetime import timedelta, datetime

def send_notifications_for_all_users():
    """Parcourt tous les calendriers et notifie les utilisateurs (propriétaires et partagés) dont l'heure de notification est proche."""
    try:
        now = datetime.now()
        start_time = (now - timedelta(minutes=2, seconds=30)).time()
        end_time = (now + timedelta(minutes=2, seconds=30)).time()
        
        with get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute("""
                    SELECT calendar_id, array_agg(DISTINCT user_id::text) as user_ids
                    FROM (
                        -- Propriétaires dont l'heure de notification est dans la fenêtre
                        SELECT c.id as calendar_id, u.id as user_id
                        FROM calendars c
                        JOIN users u ON u.id = c.owner_uid
                        JOIN calendar_settings cs ON cs.calendar_id = c.id
                        WHERE c.deleted_at IS NULL
                        AND cs.notifications_enabled = TRUE
                        AND u.notification_time > %s
                        AND u.notification_time <= %s
                        
                        UNION ALL
                        
                        -- Utilisateurs partagés dont l'heure de notification est dans la fenêtre
                        SELECT c.id as calendar_id, u.id as user_id
                        FROM calendars c
                        JOIN shared_calendars sc ON sc.calendar_id = c.id
                        JOIN shared_calendar_settings scs ON scs.shared_calendar_id = sc.id
                        JOIN users u ON u.id = sc.receiver_uid
                        WHERE c.deleted_at IS NULL
                        AND sc.deleted_at IS NULL
                        AND sc.accepted_at IS NOT NULL
                        AND scs.notifications_enabled = TRUE
                        AND u.notification_time > %s
                        AND u.notification_time <= %s
                    ) sub
                    GROUP BY calendar_id
                """, (start_time, end_time, start_time, end_time))
                rows = cursor.fetchall()
        
        for row in rows:
            notify_uids = set(row["user_ids"])
            check_low_stock_and_notify_for_calendar(row["calendar_id"], ["push"], notify_uids=notify_uids)
        
        log_backend.info(
            f"Notifications de stock faible vérifiées pour {len(rows)} calendrier(s)",
            {
                "origin": "STOCK",
                "code": "STOCK_NOTIFICATION_SENT",
                "calendar_count": len(rows),
            }
        )
    except Exception as e:
        log_backend.error(
            "Erreur lors de la récupération des calendriers pour les notifications",
            {
                "origin": "STOCK",
                "code": "STOCK_NOTIFICATION_USER_FETCH_ERROR",
                "error": str(e),
            }
        )