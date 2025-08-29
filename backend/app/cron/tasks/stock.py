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
                # Récupère d'un coup tous les calendars concernés + leurs boîtes
                cursor.execute("""
                    SELECT
                      c.id AS calendar_id,
                      COALESCE(
                        jsonb_agg(to_jsonb(mb) ORDER BY mb.created_at)
                          FILTER (WHERE mb.id IS NOT NULL),
                        '[]'::jsonb
                      ) AS boxes
                    FROM calendars c
                    JOIN calendar_settings cs ON cs.calendar_id = c.id
                    LEFT JOIN medicine_boxes mb ON mb.calendar_id = c.id
                    WHERE cs.stock_decrement_method = 'daily_midnight'
                    GROUP BY c.id
                """)
                rows = cursor.fetchall()

                current_date = datetime.now(timezone.utc).date()

                for row in rows:
                    calendar_id = row.get("calendar_id")
                    boxes = row.get("boxes") or []

                    for box in boxes:
                        id_box = box.get("id")
                        qty = box.get("stock_quantity")
                        process_box_decrement(cursor, id_box, qty, current_date, days=1)

                    # Une seule notif par calendrier après traitement de ses boîtes
                    check_low_stock_and_notify_for_calendar(calendar_id)

            conn.commit()
        log_backend.info("✅ Fin de la diminution des stocks", {"origin": "CRON", "code": "STOCK_DECREASE_SUCCESS"})

    except Exception as e:
        log_backend.error(
            f"Erreur lors de la diminution des stocks: {e}",
            {"origin": "CRON", "code": "STOCK_DECREASE_ERROR", "error": str(e)}
        )

