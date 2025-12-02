from app.db.connection import get_connection
import json

def get_boxes(calendar_id: str) -> list:
    """Récupère les boîtes de médicaments associées à un calendrier.
    
    Paramètres:
    - calendar_id (str): L'ID du calendrier.

    Retour:
    - list: La liste des boîtes de médicaments.
    """
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

def update_box(box_id: str, calendar_id: str, box: dict):
    """Met à jour une boîte de médicaments existante.

    Paramètres:
    - box_id (str): L'ID de la boîte à mettre à jour.
    - calendar_id (str): L'ID du calendrier associé.
    - box (dict): Les données de la boîte à mettre à jour.
    """
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
  INSERT INTO medicine_box_conditions (box_id, tablet_count, interval_days, start_date, time_of_day)
  SELECT
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


def create_box(calendar_id: str, box: dict) -> str:
    """Crée une nouvelle boîte de médicaments pour un calendrier donné.

    Paramètres:
    - calendar_id (str): L'ID du calendrier.
    - box (dict): Les données de la boîte à créer.

    Retour:
    - str: L'ID de la nouvelle boîte créée.
    """
    name = box.get("name") or "nouvelle boite"
    dose = box.get("dose", 0)
    box_capacity = box.get("box_capacity", 0)
    stock_alert_threshold = box.get("stock_alert_threshold", 10)
    stock_quantity = box.get("stock_quantity", 0)
    conditions = box.get("conditions", []) or []

    with get_connection() as conn:
        with conn.cursor() as cursor:
            cursor.execute("""
WITH ins_box AS (
  INSERT INTO medicine_boxes (calendar_id, name, dose, box_capacity, stock_alert_threshold, stock_quantity)
  VALUES (%s, %s, %s, %s, %s, %s)
  RETURNING id
),
ins_cond AS (
  INSERT INTO medicine_box_conditions (id, box_id, tablet_count, interval_days, start_date, time_of_day)
  SELECT
    COALESCE((c->>'id')::uuid, gen_random_uuid())        AS id,
    (SELECT id FROM ins_box)                             AS box_id,
    (c->>'tablet_count')::float8                         AS tablet_count,
    (c->>'interval_days')::int                           AS interval_days,
    NULLIF(c->>'start_date','')::date                    AS start_date,
    COALESCE(NULLIF(c->>'time_of_day',''), 'morning')    AS time_of_day
  FROM jsonb_array_elements(%s::jsonb) AS c
  -- si le tableau est vide, cette clause n'insère rien (comportement OK)
  RETURNING 1
)
SELECT id FROM ins_box;
""", (
    calendar_id, name, dose, box_capacity, stock_alert_threshold, stock_quantity,
    json.dumps(conditions)
))
            row = cursor.fetchone()
            # Selon votre cursor (tuple ou dict), récupère l'id proprement :
            box_id = row[0] if row and not isinstance(row, dict) else (row.get("id") if row else None)
            conn.commit()

    return box_id
def delete_box(box_id: str, calendar_id: str):
    """Supprime une boîte de médicaments et ses conditions associées.

    Paramètres:
    - box_id (str): L'ID de la boîte à supprimer.
    - calendar_id (str): L'ID du calendrier associé.
    """
    with get_connection() as conn:
        with conn.cursor() as cursor:
            cursor.execute("DELETE FROM medicine_boxes WHERE id = %s AND calendar_id = %s", (box_id, calendar_id))
            cursor.execute("DELETE FROM medicine_box_conditions WHERE box_id = %s", (box_id,))
            conn.commit()

def get_medicines_for_calendar(calendar_id: str) -> list:
    """Récupère les boîtes de médicaments associées à un calendrier.

    Paramètres:
    - calendar_id (str): L'ID du calendrier.

    Retour:
    - list: La liste des boîtes de médicaments.
    """
    with get_connection() as conn:
        with conn.cursor() as cursor:
            cursor.execute("""
                SELECT
                  COALESCE(
                    jsonb_agg(
                      jsonb_build_object(
                        m.box_id::text,
                        jsonb_build_object(
                          'name', m.name,
                          'dose', m.dose,
                          'conditions', m.conditions
                        )
                      )
                      ORDER BY m.name
                    ),
                    '[]'::jsonb
                  ) AS medicines
                FROM (
                  SELECT
                    mb.id   AS box_id,
                    mb.name AS name,
                    mb.dose AS dose,
                    COALESCE(
                      jsonb_agg(
                        jsonb_build_object(
                          'tablet_count', c.tablet_count,
                          'time_of_day',  c.time_of_day,
                          'interval_days', c.interval_days,
                          'start_date',    c.start_date
                        )
                        ORDER BY c.start_date NULLS LAST
                      ) FILTER (WHERE c.id IS NOT NULL),
                      '[]'::jsonb
                    ) AS conditions
                  FROM medicine_boxes mb
                  LEFT JOIN medicine_box_conditions c
                    ON c.box_id = mb.id
                  WHERE mb.calendar_id = %s
                  GROUP BY mb.id, mb.name, mb.dose
                ) AS m;
            """, (calendar_id,))
            row = cursor.fetchone()
            return row.get("medicines") or []


        
def restock_box(box_id: str, calendar_id: str) -> bool:
    """Réapprovisionne une boîte de médicaments en ajoutant sa capacité au stock actuel.

    Paramètres:
    - box_id (str): L'ID de la boîte à réapprovisionner.
    - calendar_id (str): L'ID du calendrier associé.

    Retour:
    - bool: True si la mise à jour a réussi, False sinon.
    """
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

