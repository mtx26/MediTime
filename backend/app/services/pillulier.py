from app.db.connection import get_connection
from app.services.stock import process_box_decrement, check_low_stock_and_notify_for_calendar

def use_pillulier(calendar_id, start_date):
    """
    Diminue le stock de tous les médicaments du calendrier spécifié
    si le mode de décompte est manuel.
    """
    try:
        with get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute("SELECT stock_decrement_method FROM calendars WHERE id = %s", (calendar_id,))
                row = cursor.fetchone()

                if not row:
                    return False
                method = row.get("stock_decrement_method")

                if method == "weekly_pillbox":

                    cursor.execute("""
                        SELECT id, stock_quantity FROM medicine_boxes
                        WHERE calendar_id = %s AND box_capacity > 0
                    """, (calendar_id,))
                    results = cursor.fetchall()

                    if not results:
                        return True

                    for result in results:
                        id_box = result.get("id")
                        qty = result.get("stock_quantity")

                        process_box_decrement(cursor, id_box, qty, start_date, days=7)

                    conn.commit()
                else:
                    return None

        # Vérifie les stocks faibles et envoie des notifications    
        check_low_stock_and_notify_for_calendar(calendar_id)

        return True

    except Exception as e:
        return False
