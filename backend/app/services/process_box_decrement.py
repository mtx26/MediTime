from datetime import timedelta
from app.services.calendar import is_medication_due

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
