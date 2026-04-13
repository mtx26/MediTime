from datetime import date, datetime
from app.db.connection import get_connection
from app.services.calendar import is_medication_due
from app.utils.logging import log_backend as logger


def _parse_days(days: list[str]) -> list[date]:
    """Convertit une liste de chaînes 'YYYY-MM-DD' en objets date."""
    parsed = []
    for d in days:
        if isinstance(d, str):
            parsed.append(datetime.strptime(d, "%Y-%m-%d").date())
        elif isinstance(d, date):
            parsed.append(d)
    return parsed


def _fetch_conditions(cursor, calendar_id: str) -> list[dict]:
    """Récupère les conditions actives du calendrier."""
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
    return cursor.fetchall()


def _compute_increments(conditions: list[dict], parsed_days: list[date], mode: str,
                        times: list[str] | None, per_day_times: dict | None) -> dict:
    """
    Calcule les comprimés à rajouter par box.
    Retourne un dict box_id -> { tablets_to_add, box_name, dose, stock_quantity, times_of_day }.
    """
    box_increments: dict[str, dict] = {}

    for cond in conditions:
        box_id = str(cond["box_id"])

        for day in parsed_days:
            if not is_medication_due(cond, day):
                continue

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

            tablet_count = cond.get("tablet_count", 0) or 0
            if box_id not in box_increments:
                box_increments[box_id] = {
                    "tablets_to_add": 0,
                    "box_name": cond["box_name"],
                    "dose": cond["dose"],
                    "stock_quantity": float(cond["stock_quantity"] or 0),
                    "times_of_day": set(),
                }
            box_increments[box_id]["tablets_to_add"] += tablet_count
            if cond.get("time_of_day"):
                box_increments[box_id]["times_of_day"].add(cond["time_of_day"])

    return box_increments


def preview_missed_intakes(calendar_id: str, mode: str, days: list[str],
                           times: list[str] = None, per_day_times: dict = None,
                           med_ids: list[str] = None) -> dict:
    """
    Prévisualise les prises manquées sans modifier la base de données.
    Retourne le récapitulatif avec les médicaments concernés et l'estimation du stock.
    """
    parsed_days = _parse_days(days)
    if not parsed_days:
        return {"boxes": [], "total_tablets": 0, "days": [], "mode": mode}

    with get_connection() as conn:
        with conn.cursor() as cursor:
            conditions = _fetch_conditions(cursor, calendar_id)
            if not conditions:
                return {"boxes": [], "total_tablets": 0, "days": [d.isoformat() for d in parsed_days], "mode": mode}

            if mode == "medication" and med_ids:
                med_ids_set = set(str(m) for m in med_ids)
                conditions = [c for c in conditions if str(c["box_id"]) in med_ids_set]

            box_increments = _compute_increments(conditions, parsed_days, mode, times, per_day_times)

            boxes = []
            total = 0
            for box_id, info in box_increments.items():
                if info["tablets_to_add"] <= 0:
                    continue
                old_stock = info["stock_quantity"]
                new_stock = old_stock + info["tablets_to_add"]
                boxes.append({
                    "box_id": box_id,
                    "name": info["box_name"],
                    "dose": info["dose"],
                    "tablets_to_add": info["tablets_to_add"],
                    "old_stock": old_stock,
                    "new_stock": new_stock,
                    "times_of_day": sorted(info["times_of_day"]),
                })
                total += info["tablets_to_add"]

            return {
                "boxes": boxes,
                "total_tablets": total,
                "days": [d.isoformat() for d in sorted(parsed_days)],
                "mode": mode,
            }


def apply_missed_intakes(calendar_id: str, mode: str, days: list[str],
                         times: list[str] = None, per_day_times: dict = None,
                         med_ids: list[str] = None) -> dict:
    """
    Applique les prises manquées en rajoutant les comprimés non pris au stock.
    Retour: { "updated_boxes": [...], "total_tablets_added": int }
    """
    parsed_days = _parse_days(days)
    if not parsed_days:
        return {"updated_boxes": [], "total_tablets_added": 0}

    with get_connection() as conn:
        with conn.cursor() as cursor:
            conditions = _fetch_conditions(cursor, calendar_id)
            if not conditions:
                return {"updated_boxes": [], "total_tablets_added": 0}

            if mode == "medication" and med_ids:
                med_ids_set = set(str(m) for m in med_ids)
                conditions = [c for c in conditions if str(c["box_id"]) in med_ids_set]

            box_increments = _compute_increments(conditions, parsed_days, mode, times, per_day_times)

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
