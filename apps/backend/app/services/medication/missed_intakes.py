from datetime import date, datetime
from app.db.connection import get_connection
from app.services.calendar import is_medication_due
from app.utils.logging import log_backend as logger


def apply_missed_intakes(calendar_id: str, mode: str, days: list[str], times: list[str] = None, per_day_times: dict = None, med_ids: list[str] = None) -> dict:
    """
    Applique les prises manquées en rajoutant les comprimés non pris au stock.

    Mode 'intake':
      - On parcourt tous les médicaments du calendrier
      - Pour chaque jour sélectionné, on vérifie si le médicament devait être pris (is_medication_due + time_of_day)
      - On rajoute tablet_count au stock pour chaque prise manquée

    Mode 'medication':
      - On parcourt uniquement les médicaments sélectionnés (med_ids = box_ids)
      - Pour chaque jour, on rajoute toutes les prises manquées (tous moments confondus)

    Retour: { "updated_boxes": [...], "total_tablets_added": int }
    """
    parsed_days = []
    for d in days:
        if isinstance(d, str):
            parsed_days.append(datetime.strptime(d, "%Y-%m-%d").date())
        elif isinstance(d, date):
            parsed_days.append(d)

    if not parsed_days:
        return {"updated_boxes": [], "total_tablets_added": 0}

    with get_connection() as conn:
        with conn.cursor() as cursor:
            # Récupérer les conditions actives du calendrier
            cursor.execute("""
                SELECT
                    cond.id AS condition_id,
                    cond.box_id,
                    cond.time_of_day,
                    cond.interval_days,
                    cond.start_date,
                    cond.max_date,
                    cond.tablet_count,
                    box.name AS box_name,
                    box.dose,
                    box.stock_quantity
                FROM medicine_boxes box
                JOIN medicine_box_conditions cond ON cond.box_id = box.id
                WHERE box.calendar_id = %s
                    AND box.deleted_at IS NULL
                    AND cond.deleted_at IS NULL
            """, (calendar_id,))
            conditions = cursor.fetchall()

            if not conditions:
                return {"updated_boxes": [], "total_tablets_added": 0}

            # Filtrer par med_ids si mode medication (cast str pour éviter UUID vs string)
            if mode == "medication" and med_ids:
                med_ids_set = set(str(m) for m in med_ids)
                conditions = [c for c in conditions if str(c["box_id"]) in med_ids_set]

            # Calculer les comprimés à rajouter par box
            box_increments = {}  # box_id -> { tablets_to_add, box_name, dose }

            for cond in conditions:
                box_id = str(cond["box_id"])

                for day in parsed_days:
                    # Vérifier si le médicament devait être pris ce jour
                    if not is_medication_due(cond, day):
                        continue

                    # Mode intake: vérifier le moment de la journée
                    if mode == "intake":
                        day_key = day.isoformat()
                        if per_day_times and day_key in per_day_times:
                            day_times = per_day_times[day_key]
                        elif times:
                            day_times = times
                        else:
                            continue

                        if cond["time_of_day"] not in day_times:
                            continue

                    # Accumuler
                    tablet_count = cond.get("tablet_count", 0) or 0
                    if box_id not in box_increments:
                        box_increments[box_id] = {
                            "tablets_to_add": 0,
                            "box_name": cond["box_name"],
                            "dose": cond["dose"],
                        }
                    box_increments[box_id]["tablets_to_add"] += tablet_count

            # Appliquer les incréments (UPDATE atomique pour éviter les race conditions)
            updated_boxes = []
            total_added = 0

            for box_id, info in box_increments.items():
                if info["tablets_to_add"] <= 0:
                    continue

                cursor.execute(
                    "UPDATE medicine_boxes SET stock_quantity = stock_quantity + %s WHERE id = %s AND deleted_at IS NULL RETURNING stock_quantity",
                    (info["tablets_to_add"], box_id)
                )
                row = cursor.fetchone()
                new_stock = row["stock_quantity"] if row else 0
                updated_boxes.append({
                    "box_id": box_id,
                    "name": info["box_name"],
                    "dose": info["dose"],
                    "tablets_added": info["tablets_to_add"],
                    "old_stock": new_stock - info["tablets_to_add"],
                    "new_stock": new_stock,
                })
                total_added += info["tablets_to_add"]

            logger.info("Prises manquées appliquées", {
                "origin": "MISSED_INTAKES",
                "code": "MISSED_INTAKES_APPLIED",
                "calendar_id": calendar_id,
                "mode": mode,
                "days_count": len(parsed_days),
                "boxes_updated": len(updated_boxes),
                "total_tablets_added": total_added,
            })

            return {
                "updated_boxes": updated_boxes,
                "total_tablets_added": total_added,
            }
