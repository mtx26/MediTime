from app.db.connection import get_connection
from .stock import process_box_decrement, process_box_increment, check_low_stock_and_notify_for_calendar
from datetime import timedelta

def use_pillbox(calendar_id: str, start_date: str) -> bool | None:
    """Utilise le stock de tous les médicaments du calendrier spécifié
    pour une semaine donnée.

    Paramètres:
    - calendar_id: ID du calendrier.
    - start_date: date de la semaine (DD-MM-YYYY).

    Retour:
    - bool | None: True si l'opération a réussi, False sinon, None si la méthode n'est pas "weekly_pillbox".
    """
    try:
        with get_connection() as conn:
            with conn.cursor() as cursor:
                monday = start_date - timedelta(days=start_date.weekday())

                # 1 requête : récupère la méthode + les boîtes éligibles
                cursor.execute("""
                    SELECT
                        cs.stock_decrement_method,
                        COALESCE(
                            jsonb_agg(
                                jsonb_build_object('box_id', mb.id, 'stock_quantity', mb.stock_quantity)
                            ) FILTER (WHERE mb.id IS NOT NULL),
                            '[]'::jsonb
                        ) as boxes
                    FROM calendars c
                    LEFT JOIN calendar_settings cs ON cs.calendar_id = c.id
                    LEFT JOIN medicine_boxes mb
                      ON mb.calendar_id = c.id
                     AND mb.box_capacity > 0
                    WHERE c.id = %s
                    GROUP BY c.id, cs.stock_decrement_method
                """, (calendar_id,))
                row = cursor.fetchone()

                # Calendrier inexistant
                if not row:
                    return False

                method = row.get("stock_decrement_method")
                if method != "weekly_pillbox":
                    return None

                # Boîtes à traiter
                boxes = row.get("boxes")

                # Même comportement qu'avant : si aucune boîte -> True immédiat (pas de notif)
                if not boxes:
                    return True

                for box in boxes:
                    process_box_decrement(cursor, box['box_id'], box['stock_quantity'], monday, days=7)

                conn.commit()

        # Notifications faibles ensuite, comme avant
        check_low_stock_and_notify_for_calendar(calendar_id)
        return True

    except Exception:
        return False

def restore_pillbox(calendar_id: str, start_date: str) -> bool:
    """Restaure le stock de tous les médicaments du calendrier spécifié
    pour une semaine donnée.

    Paramètres:
    - calendar_id: ID du calendrier.
    - start_date: date de la semaine (DD-MM-YYYY).

    Retour:
    - bool: True si l'opération a réussi, False sinon.
    """
    try:
        with get_connection() as conn:
            with conn.cursor() as cursor:
                monday = start_date - timedelta(days=start_date.weekday())

                # Récupère les boîtes sous forme de liste JSON
                # Si le calendrier n'existe pas, aucune ligne n'est retournée.
                # Si le calendrier existe mais n'a pas de boîtes, 'boxes' sera une liste vide [].
                cursor.execute("""
                    SELECT
                        COALESCE(
                            jsonb_agg(
                                jsonb_build_object('box_id', mb.id, 'stock_quantity', mb.stock_quantity)
                            ) FILTER (WHERE mb.id IS NOT NULL),
                            '[]'::jsonb
                        ) as boxes
                    FROM calendars c
                    LEFT JOIN medicine_boxes mb
                      ON mb.calendar_id = c.id
                     AND mb.box_capacity > 0
                    WHERE c.id = %s
                    GROUP BY c.id
                """, (calendar_id,))

                row = cursor.fetchone()

                # Calendrier inexistant
                if not row:
                    return False

                boxes = row.get("boxes")

                if not boxes:
                    return True

                for box in boxes:
                    process_box_increment(cursor, box['box_id'], box['stock_quantity'], monday, days=7)

                conn.commit()

        return True

    except Exception:
        return False
