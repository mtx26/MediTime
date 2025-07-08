from datetime import timedelta
from app.services.calendar import is_medication_due
from app.db.connection import get_connection
from app.services.notifications import notify_and_record
from app.utils.logger import log_backend
from app.config import Config
from urllib.parse import urljoin
from collections import defaultdict

def process_box_decrement(cursor, id_box, qty, start_date, days=7):
    """
    Calcule et applique la diminution du stock pour une boîte donnée
    sur un ou plusieurs jours (par défaut 7).
    
    Args:
        cursor: curseur psycopg2 pour la base.
        id_box: ID de la boîte de médicament.
        qty: quantité actuelle de la boîte.
        start_date: date de départ (datetime.date).
        days: nombre de jours à traiter (1 ou 7 en général).
    """
    if not start_date or days < 1:
        return

    cursor.execute("""
        SELECT tablet_count, start_date, interval_days
        FROM medicine_box_conditions
        WHERE box_id = %s
    """, (id_box,))
    conditions = cursor.fetchall()

    total_tablets = 0
    for i in range(days):
        day = start_date + timedelta(days=i)

        total_tablets_day = sum(
            condition.get("tablet_count") for condition in conditions
            if is_medication_due(condition, day) and condition.get("tablet_count") is not None
        )

        total_tablets += total_tablets_day

    if total_tablets > 0:
        new_qty = qty - total_tablets
        cursor.execute(
            "UPDATE medicine_boxes SET stock_quantity = %s WHERE id = %s",
            (new_qty, id_box)
        )

# Vérifie les stocks faibles et envoie des notifications
def check_low_stock_and_notify():
    log_backend.info("🔍 Vérification des stocks faibles", {"origin": "CRON", "code": "STOCK_CHECK_INIT"})

    try:
        with get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute(
                    """
                    SELECT m.id, m.name, m.stock_quantity, m.stock_alert_threshold, c.owner_uid, m.calendar_id
                    FROM medicine_boxes m
                    JOIN calendars c ON m.calendar_id = c.id
                    WHERE m.stock_quantity <= m.stock_alert_threshold AND m.stock_alert_threshold > 0
                    """
                )

                results = cursor.fetchall()

        grouped: dict[tuple[str, int], list[dict]] = defaultdict(list)
        for result in results:
            link = urljoin(Config.FRONTEND_URL or "", f"/medication/{result.get('id')}")
            key = (result.get("owner_uid"), result.get("calendar_id"))

            grouped[key].append(
                {
                    "link": link,
                    "medication_id": result.get("id"),
                    "medication_qty": result.get("stock_quantity"),
                    "calendar_id": result.get("calendar_id"),
                    "sender_uid": Config.SYSTEM_UID,
                }
            )

        for (uid, calendar_id), notifs in grouped.items():
            try:
                notify_and_record(uid=uid, json_body=notifs, notif_type="low_stock")
                log_backend.info(
                    "✅ Notifications de stock faible envoyées",
                    {
                        "origin": "CRON",
                        "code": "STOCK_CHECK_SUCCESS",
                        "uid": uid,
                        "calendar_id": calendar_id,
                        "count": len(notifs),
                    },
                )
            except Exception as e:
                log_backend.error(
                    "Erreur envoi notifications stock faible",
                    {
                        "origin": "CRON",
                        "code": "STOCK_CHECK_ERROR",
                        "uid": uid,
                        "calendar_id": calendar_id,
                        "error": str(e),
                    },
                )

        log_backend.info("✅ Fin de la vérification des stocks", {"origin": "CRON", "code": "STOCK_CHECK_SUCCESS"})

    except Exception as e:
        log_backend.error(
            "Erreur lors de la vérification des stocks",
            {"origin": "CRON", "code": "STOCK_CHECK_ERROR", "error": str(e)},
        )

def check_low_stock_and_notify_for_calendar(calendar_id: int):
    """
    Vérifie les stocks faibles pour un calendrier spécifique et envoie des notifications.
    
    Args:
        calendar_id: ID du calendrier à vérifier.
    """
    log_backend.info(
        "🔍 Vérification des stocks faibles pour le calendrier",
        {"origin": "CRON", "code": "STOCK_CHECK_CALENDAR_INIT", "calendar_id": calendar_id},
    )

    try:
        with get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute(
                    """
                    SELECT m.id, m.name, m.stock_quantity, m.stock_alert_threshold, c.owner_uid
                    FROM medicine_boxes m
                    JOIN calendars c ON m.calendar_id = c.id
                    WHERE m.calendar_id = %s AND m.stock_quantity <= m.stock_alert_threshold AND m.stock_alert_threshold > 0
                    """,
                    (calendar_id,)
                )

                results = cursor.fetchall()

        if not results:
            log_backend.info(
                "Aucun stock faible trouvé pour le calendrier",
                {"origin": "CRON", "code": "STOCK_CHECK_CALENDAR_EMPTY", "calendar_id": calendar_id},
            )
            return

        grouped: dict[str, list[dict]] = defaultdict(list)
        for result in results:
            link = urljoin(Config.FRONTEND_URL or "", f"/medication/{result.get('id')}")
            uid = result.get("owner_uid")

            grouped[uid].append(
                {
                    "link": link,
                    "medication_id": result.get("id"),
                    "medication_qty": result.get("stock_quantity"),
                    "calendar_id": calendar_id,
                    "sender_uid": Config.SYSTEM_UID,
                }
            )

        for uid, notifs in grouped.items():
            try:
                notify_and_record(uid=uid, json_body=notifs, notif_type="low_stock")
                log_backend.info(
                    "✅ Notifications de stock faible envoyées pour le calendrier",
                    {
                        "origin": "CRON",
                        "code": "STOCK_CHECK_CALENDAR_SUCCESS",
                        "uid": uid,
                        "calendar_id": calendar_id,
                        "count": len(notifs),
                    },
                )
            except Exception as e:
                log_backend.error(
                    "Erreur envoi notifications stock faible pour le calendrier",
                    {
                        "origin": "CRON",
                        "code": "STOCK_CHECK_CALENDAR_ERROR",
                        "uid": uid,
                        "calendar_id": calendar_id,
                        "error": str(e),
                    }
                )
    except Exception as e:
        log_backend.error(
            "Erreur lors de la vérification des stocks pour le calendrier",
            {
                "origin": "CRON", 
                "code": "STOCK_CHECK_CALENDAR_ERROR", 
                "calendar_id": calendar_id, 
                "error": str(e)
            }
        )

def check_if_stock_is_low(calendar_id: int) -> bool:
    """
    Vérifie si le stock d'un calendrier est faible.
    
    Args:
        calendar_id: ID du calendrier à vérifier.
    
    Returns:
        bool: True si le stock est faible, False sinon.
    """
    with get_connection() as conn:
        with conn.cursor() as cursor:
            cursor.execute(
                """
                SELECT COUNT(*) FROM medicine_boxes
                WHERE calendar_id = %s AND stock_quantity <= stock_alert_threshold AND stock_alert_threshold > 0
                """,
                (calendar_id,)
            )
            count_row = cursor.fetchone()
            count = count_row.get("count", 0)
            return count > 0