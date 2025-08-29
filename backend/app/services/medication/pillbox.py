from app.db.connection import get_connection
from .stock import process_box_decrement, check_low_stock_and_notify_for_calendar

def use_pillulier(calendar_id, start_date):
    """
    Diminue le stock de tous les médicaments du calendrier spécifié
    si le mode de décompte est weekly_pillbox.
    """
    try:
        with get_connection() as conn:
            with conn.cursor() as cursor:
                # 1 requête : récupère la méthode + les boîtes éligibles
                cursor.execute("""
                    SELECT
                        cs.stock_decrement_method,
                        mb.id AS box_id,
                        mb.stock_quantity
                    FROM calendars c
                    LEFT JOIN calendar_settings cs ON cs.calendar_id = c.id
                    LEFT JOIN medicine_boxes mb
                      ON mb.calendar_id = c.id
                     AND mb.box_capacity > 0
                    WHERE c.id = %s
                """, (calendar_id,))
                rows = cursor.fetchall()

                # Calendrier inexistant
                if not rows:
                    return False

                method = rows[0].get("stock_decrement_method")
                if method != "weekly_pillbox":
                    return None

                # Boîtes à traiter
                boxes = [(r.get("box_id"), r.get("stock_quantity")) for r in rows if r.get("box_id")]

                # Même comportement qu'avant : si aucune boîte -> True immédiat (pas de notif)
                if not boxes:
                    return True

                for box_id, qty in boxes:
                    process_box_decrement(cursor, box_id, qty, start_date, days=7)

                conn.commit()

        # Notifications faibles ensuite, comme avant
        check_low_stock_and_notify_for_calendar(calendar_id)
        return True

    except Exception:
        return False
