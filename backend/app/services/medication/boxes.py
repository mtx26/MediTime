from app.db.connection import get_connection

def get_boxes(calendar_id):
    with get_connection() as conn:
        with conn.cursor() as cursor:
            cursor.execute("""
                SELECT
                  mb.id,
                  mb.name,
                  mb.box_capacity,
                  mb.stock_quantity,
                  mb.stock_alert_threshold,
                  mb.calendar_id,
                  c.name AS calendar_name,
                  mb.dose,
                  /* conditions: EXACTEMENT la liste des lignes de medicine_box_conditions */
                  COALESCE((
                    SELECT jsonb_agg(to_jsonb(mbc) ORDER BY mbc.created_at)
                    FROM medicine_box_conditions mbc
                    WHERE mbc.box_id = mb.id
                  ), '[]'::jsonb) AS conditions,
                  /* url_notice_fr liée au nom de la boîte (équivalent à ILIKE sans wildcard) */
                  (
                    SELECT maf."url_notice_fr"
                    FROM medicaments_afmps maf
                    WHERE maf."name" ILIKE mb.name
                    LIMIT 1
                  ) AS url_notice_fr
                FROM medicine_boxes mb
                JOIN calendars c ON c.id = mb.calendar_id
                WHERE mb.calendar_id = %s
                ORDER BY mb.created_at;
            """, (calendar_id,))
            boxes = cursor.fetchall()

    return boxes or []

def update_box(box_id, calendar_id, box):
    import json

    name = box.get("name")
    dose = box.get("dose")
    box_capacity = box.get("box_capacity")
    stock_alert_threshold = box.get("stock_alert_threshold")
    stock_quantity = box.get("stock_quantity")
    conditions = box.get("conditions", []) or []

    with get_connection() as conn:
        with conn.cursor() as cursor:
            cursor.execute("""
WITH upd AS (
  UPDATE medicine_boxes 
  SET name = %s,
      dose = %s,
      box_capacity = %s,
      stock_alert_threshold = %s,
      stock_quantity = %s
  WHERE id = %s AND calendar_id = %s
  RETURNING id
),
del AS (
  DELETE FROM medicine_box_conditions
  WHERE box_id = %s
),
ins AS (
  INSERT INTO medicine_box_conditions (id, box_id, tablet_count, interval_days, start_date, time_of_day)
  SELECT
    COALESCE((c->>'id')::uuid, gen_random_uuid())                 AS id,
    %s                                                             AS box_id,
    (c->>'tablet_count')::float8                                   AS tablet_count,
    (c->>'interval_days')::int                                     AS interval_days,
    NULLIF(c->>'start_date','')::date                              AS start_date,
    COALESCE(NULLIF(c->>'time_of_day',''), 'morning')              AS time_of_day
  FROM jsonb_array_elements(%s::jsonb) AS c
  RETURNING 1
)
SELECT 1;
""", (
    name, dose, box_capacity, stock_alert_threshold, stock_quantity,
    box_id, calendar_id,      # upd WHERE
    box_id,                   # del
    box_id,                   # ins (box_id)
    json.dumps(conditions)    # ins (payload)
))
            conn.commit()

def create_box(calendar_id, box):
    name = box.get("name", "nouvelle boite")
    box_capacity = box.get("box_capacity", 0)
    stock_alert_threshold = box.get("stock_alert_threshold", 10)
    stock_quantity = box.get("stock_quantity", 0)
    dose = box.get("dose", 0)

    with get_connection() as conn:
        with conn.cursor() as cursor:
            cursor.execute("""
                INSERT INTO medicine_boxes (calendar_id, name, dose, box_capacity, stock_alert_threshold, stock_quantity) 
                VALUES (%s, %s, %s, %s, %s, %s)
                RETURNING id
            """, (calendar_id, name, dose, box_capacity, stock_alert_threshold, stock_quantity))
            box = cursor.fetchone()
            box_id = box.get("id")
            conn.commit()

    return box_id

def delete_box(box_id, calendar_id):
    with get_connection() as conn:
        with conn.cursor() as cursor:
            cursor.execute("DELETE FROM medicine_boxes WHERE id = %s AND calendar_id = %s", (box_id, calendar_id))
            cursor.execute("DELETE FROM medicine_box_conditions WHERE box_id = %s", (box_id,))
            conn.commit()

def get_medicines_for_calendar(calendar_id):
    with get_connection() as conn:
        with conn.cursor() as cursor:
            cursor.execute("""
                SELECT
                    mb.name,
                    mb.dose,
                    c.tablet_count,
                    c.time_of_day,
                    c.interval_days,
                    c.start_date
                FROM medicine_boxes mb
                LEFT JOIN medicine_box_conditions c ON mb.id = c.box_id
                WHERE mb.calendar_id = %s
                ORDER BY mb.name, c.start_date NULLS LAST
            """, (calendar_id,))
            medicines = cursor.fetchall()

            grouped = {}
            for med in medicines:
                name = med["name"]
                dose = med["dose"]

                # Extraire les conditions uniquement
                condition = {
                    "tablet_count": med["tablet_count"],
                    "time_of_day": med["time_of_day"],
                    "interval_days": med["interval_days"],
                    "start_date": med["start_date"],
                }

                if name not in grouped:
                    grouped[name] = {
                        "dose": dose,
                        "conditions": []
                    }
                grouped[name]["conditions"].append(condition)

            return grouped
        
def restock_box(box_id, calendar_id):
    try:
        with get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute("""
                    UPDATE medicine_boxes 
                    SET stock_quantity = stock_quantity + box_capacity 
                    WHERE id = %s AND calendar_id = %s
                """, (box_id, calendar_id))
                conn.commit()
        return True
    except Exception as e:
        return False

