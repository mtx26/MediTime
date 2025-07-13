from app.db.connection import get_connection

def save_analysis_result(calendar_id: str, analysis_result: dict):
    with get_connection() as conn:
        with conn.cursor() as cursor:
            for box in analysis_result.get("medicine_boxes", []):
                cursor.execute(
                    """INSERT INTO medicine_boxes (calendar_id, name, dose) VALUES (%s, %s, %s) RETURNING id""",
                    (calendar_id, box["name"], box["dose"])
                )
                box_id = cursor.fetchone()[0]

                for condition in box["conditions"]:
                    cursor.execute(
                        """INSERT INTO medicine_box_conditions
                           (box_id, time_of_day, interval_days, start_date, tablet_count)
                           VALUES (%s, %s, %s, %s, %s)""",
                        (
                            box_id,
                            condition["time_of_day"],
                            condition["interval_days"],
                            condition["start_date"],
                            condition["tablet_count"]
                        )
                    )

            conn.commit()
