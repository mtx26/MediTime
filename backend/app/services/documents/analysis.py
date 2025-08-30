from app.db.connection import get_connection
import json

def save_analysis_result(owner_uid: str, calendar_name: str, boxes: list) -> str:

    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                WITH ins_cal AS (
                  INSERT INTO public.calendars (owner_uid, name)
                  VALUES (%s, %s)
                  RETURNING id
                ),
                boxes_input AS (
                  SELECT
                    (b->>'name')::text                            AS name,
                    NULLIF(b->>'dose','')::int                    AS dose,
                    COALESCE(NULLIF(b->>'stock_max','')::int, 0)  AS box_capacity,
                    COALESCE(NULLIF(b->>'stock_quantity','')::double precision, 0) AS stock_quantity,
                    COALESCE(NULLIF(b->>'stock_alert_threshold','')::int, 0)       AS stock_alert_threshold,
                    b->'conditions'                               AS conditions_json
                  FROM json_array_elements(%s::json) AS b
                ),
                ins_boxes AS (
                  INSERT INTO public.medicine_boxes
                    (calendar_id, name, dose, box_capacity, stock_quantity, stock_alert_threshold)
                  SELECT
                    (SELECT id FROM ins_cal) AS calendar_id,
                    bi.name, bi.dose, bi.box_capacity, bi.stock_quantity, bi.stock_alert_threshold
                  FROM boxes_input bi
                  RETURNING
                    id,
                    name,
                    dose,
                    box_capacity,
                    stock_quantity,
                    stock_alert_threshold
                ),
                conds_input AS (
                  SELECT
                    ib.id AS box_id,
                    (c->>'time_of_day')::text              AS time_of_day,
                    (c->>'interval_days')::int             AS interval_days,
                    NULLIF(c->>'start_date','')::date      AS start_date,
                    (c->>'tablet_count')::double precision AS tablet_count
                  FROM boxes_input bi
                  JOIN ins_boxes ib
                    ON ib.name = bi.name
                   AND COALESCE(ib.dose, -2147483648) = COALESCE(bi.dose, -2147483648)
                   AND ib.box_capacity   = bi.box_capacity
                   AND ib.stock_quantity = bi.stock_quantity
                   AND ib.stock_alert_threshold = bi.stock_alert_threshold
                  /* IMPORTANT: SRF en LATERAL, avec [] si NULL */
                  CROSS JOIN LATERAL json_array_elements(
                    COALESCE(bi.conditions_json, '[]'::json)
                  ) AS c
                ),
                ins_conds AS (
                  INSERT INTO public.medicine_box_conditions
                    (box_id, time_of_day, interval_days, start_date, tablet_count)
                  SELECT
                    ci.box_id, ci.time_of_day, ci.interval_days, ci.start_date, ci.tablet_count
                  FROM conds_input ci
                  RETURNING 1
                )
                SELECT id AS calendar_id FROM ins_cal;
            """, (owner_uid, calendar_name, json.dumps(boxes)))

            row = cur.fetchone()
            calendar_id = row.get("calendar_id")

        conn.commit()
        return calendar_id
