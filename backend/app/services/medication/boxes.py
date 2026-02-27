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

                  /* conditions : EXACTEMENT identiques à la version originale */
                  COALESCE(
                    jsonb_agg(to_jsonb(mbc) ORDER BY mbc.created_at)
                      FILTER (WHERE mbc.id IS NOT NULL),
                    '[]'::jsonb
                  ) AS conditions,

                  maf.url_notice_fr

                FROM medicine_boxes mb

                JOIN calendars c
                  ON c.id = mb.calendar_id
                 AND c.deleted_at IS NULL

                /* récupération des conditions en une seule passe */
                LEFT JOIN medicine_box_conditions mbc
                  ON mbc.box_id = mb.id
                 AND mbc.deleted_at IS NULL

                /* Recherche de l'URL : d'abord par code_fmd (rapide), sinon par nom */
                LEFT JOIN LATERAL (
                  SELECT maf."url_notice_fr"
                  FROM medicaments_afmps maf
                  WHERE CASE 
                    WHEN mb.code_fmd IS NOT NULL THEN maf.code_fmd = mb.code_fmd
                    ELSE maf."name" ILIKE mb.name
                  END
                  LIMIT 1
                ) maf ON true

                WHERE mb.calendar_id = %s
                  AND mb.deleted_at IS NULL

                GROUP BY
                  mb.id,
                  c.name,
                  maf.url_notice_fr

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
    name = box.get("name") or "nouvelle boite"
    dose = box.get("dose") or 0
    box_capacity = box.get("box_capacity") or 0
    stock_alert_threshold = box.get("stock_alert_threshold") or 10
    stock_quantity = box.get("stock_quantity") or 0
    code_fmd = box.get("code_fmd") or None
    conditions = box.get("conditions") or []

    with get_connection() as conn:
        with conn.cursor() as cursor:
            cursor.execute("""
              WITH upd AS (
                UPDATE medicine_boxes 
                SET name = %s,
                    dose = %s,
                    box_capacity = %s,
                    stock_alert_threshold = %s,
                    stock_quantity = %s,
                    code_fmd = %s
                WHERE id = %s AND calendar_id = %s AND deleted_at IS NULL
                RETURNING id
              ),
              del AS (
                UPDATE medicine_box_conditions
                SET deleted_at = NOW()
                WHERE box_id IN (SELECT id FROM upd)
                  AND deleted_at IS NULL
              ),
              ins AS (
                INSERT INTO medicine_box_conditions (box_id, tablet_count, interval_days, start_date, time_of_day, max_date)
                SELECT
                  %s                                                             AS box_id,
                  (c->>'tablet_count')::float8                                   AS tablet_count,
                  (c->>'interval_days')::int                                     AS interval_days,
                  NULLIF(c->>'start_date','')::date                              AS start_date,
                  COALESCE(NULLIF(c->>'time_of_day',''), 'morning')              AS time_of_day,
                  NULLIF(c->>'max_date','')::date                                AS max_date
                FROM jsonb_array_elements(%s::jsonb) AS c
                WHERE EXISTS (SELECT 1 FROM upd)
                RETURNING 1
              )
              SELECT 1;
            """, (
                name, dose, box_capacity, stock_alert_threshold, stock_quantity, code_fmd,
                box_id, calendar_id,      # upd WHERE
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
    dose = box.get("dose") or 0
    box_capacity = box.get("box_capacity") or 0
    stock_alert_threshold = box.get("stock_alert_threshold") or 10
    stock_quantity = box.get("stock_quantity") or 0
    code_fmd = box.get("code_fmd") or None
    conditions = box.get("conditions") or []

    with get_connection() as conn:
        with conn.cursor() as cursor:
            # 1. Insérer d'abord la box
            cursor.execute("""
              INSERT INTO medicine_boxes (calendar_id, name, dose, box_capacity, stock_alert_threshold, stock_quantity, code_fmd)
              VALUES (%s, %s, %s, %s, %s, %s, %s)
              RETURNING id
              """, (calendar_id, name, dose, box_capacity, stock_alert_threshold, stock_quantity, code_fmd))
            
            row = cursor.fetchone()
            box_id = row[0] if row and not isinstance(row, dict) else (row.get("id") if row else None)
            
            # 2. Puis insérer les conditions si elles existent
            if conditions and box_id:
                cursor.execute("""
                  INSERT INTO medicine_box_conditions (id, box_id, tablet_count, interval_days, start_date, time_of_day, max_date)
                  SELECT
                    COALESCE((c->>'id')::uuid, gen_random_uuid())        AS id,
                    %s::uuid                                             AS box_id,
                    (c->>'tablet_count')::float8                         AS tablet_count,
                    (c->>'interval_days')::int                           AS interval_days,
                    NULLIF(c->>'start_date','')::timestamp               AS start_date,
                    COALESCE(NULLIF(c->>'time_of_day',''), 'morning')    AS time_of_day,
                    NULLIF(c->>'max_date','')::timestamp                 AS max_date
                  FROM jsonb_array_elements(%s::jsonb) AS c
                  """, (box_id, json.dumps(conditions)))
            
            conn.commit()

    return box_id
  
  
def delete_box(box_id: str, calendar_id: str):
    """Supprime une boîte de médicaments.

    Paramètres:
    - box_id (str): L'ID de la boîte à supprimer.
    - calendar_id (str): L'ID du calendrier associé.
    """
    with get_connection() as conn:
      with conn.cursor() as cursor:
        cursor.execute(
          """
          UPDATE medicine_boxes
          SET deleted_at = COALESCE(deleted_at, NOW())
          WHERE id = %s AND calendar_id = %s AND deleted_at IS NULL
          """,
          (box_id, calendar_id)
        )
        conn.commit()


GET_MEDICINES_QUERY = """
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
        AND mb.deleted_at IS NULL
        AND c.deleted_at IS NULL
      GROUP BY mb.id, mb.name, mb.dose
    ) AS m;
"""

def get_medicines_for_calendar(calendar_id: str) -> list:
    """Récupère les boîtes de médicaments associées à un calendrier.

    Paramètres:
    - calendar_id (str): L'ID du calendrier.

    Retour:
    - list: La liste des boîtes de médicaments.
    """
    with get_connection() as conn:
        with conn.cursor() as cursor:
            cursor.execute(GET_MEDICINES_QUERY, (calendar_id,))
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
                    WHERE id = %s AND calendar_id = %s AND deleted_at IS NULL
                """, (box_id, calendar_id))
                conn.commit()
        return True
    except Exception as e:
        return False

