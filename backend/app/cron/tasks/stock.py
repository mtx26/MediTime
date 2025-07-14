# app/cron/tasks/stock.py
from app.db.connection import get_connection
from app.utils.logging import log_backend
from app.services.medication import check_low_stock_and_notify_for_calendar, process_box_decrement
from datetime import datetime, timezone

# diminuer le stock de tous les médicaments
def decrease_stock():
    try:
        with get_connection() as conn:
            with conn.cursor() as cursor:
                # recup les calendar avec stock_decrement_method = auto
                cursor.execute("""
                    SELECT * FROM calendars
                    WHERE stock_decrement_method = 'daily_midnight'
                """)
                calendars = cursor.fetchall()

                for calendar in calendars:
                    calendar_id = calendar.get("id")
                    cursor.execute("""
                        SELECT * FROM medicine_boxes
                        WHERE calendar_id = %s
                    """, (calendar_id,))
                    results = cursor.fetchall()

                    current_date = datetime.now(timezone.utc).date()

                    for result in results:
                        id_box = result.get("id")
                        qty = result.get("stock_quantity")
                        process_box_decrement(cursor, id_box, qty, current_date, days=1)
                    
                    check_low_stock_and_notify_for_calendar(calendar_id)

            conn.commit()
        log_backend.info("✅ Fin de la diminution des stocks", {"origin": "CRON", "code": "STOCK_DECREASE_SUCCESS"})

    except Exception as e:
        log_backend.error(f"Erreur lors de la diminution des stocks: {e}", {"origin": "CRON", "code": "STOCK_DECREASE_ERROR", "error": str(e)})