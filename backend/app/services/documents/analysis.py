from app.db.connection import get_connection

def save_analysis_result(calendar_id: str, analysis_result: dict):
    import json
    with get_connection() as conn:
        with conn.cursor() as cursor:
            cursor.execute("""
WITH input AS (
  SELECT %s::uuid AS calendar_id, %s::jsonb AS data
),
boxes AS (
  SELECT
    gen_random_uuid() AS id,
    i.calendar_id,
    NULLIF(b.box->>'name','')       AS name,
    NULLIF(b.box->>'dose','')::int  AS dose,
    b.box
  FROM input i
  CROSS JOIN LATERAL jsonb_array_elements(COALESCE(i.data->'medicine_boxes','[]'::jsonb)) AS b(box)
),
ins_boxes AS (
  INSERT INTO medicine_boxes (id, calendar_id, name, dose)
  SELECT id, calendar_id, name, dose
  FROM boxes
  RETURNING 1
),
ins_conditions AS (
  INSERT INTO medicine_box_conditions (box_id, time_of_day, interval_days, start_date, tablet_count)
  SELECT
    b.id,
    COALESCE(c.cond->>'time_of_day','morning')                         AS time_of_day,
    COALESCE(NULLIF(c.cond->>'interval_days','')::int, 1)              AS interval_days,
    NULLIF(c.cond->>'start_date','')::date                             AS start_date,
    (c.cond->>'tablet_count')::float8                                  AS tablet_count
  FROM boxes b
  CROSS JOIN LATERAL jsonb_array_elements(COALESCE(b.box->'conditions','[]'::jsonb)) AS c(cond)
  RETURNING 1
)
-- on référence les deux CTE d’INSERT pour forcer leur exécution
SELECT 1;
""", (calendar_id, json.dumps(analysis_result)))
            conn.commit()
            
