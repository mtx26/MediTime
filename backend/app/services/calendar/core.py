from datetime import timedelta, date
from app.utils.logging import log_backend as logger
from app.db.connection import get_connection

def generate_calendar_schedule(calendar_id, start_date):
    try:
        with get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute("""
                    SELECT
                        c.name AS calendar_name,
                        cond.id,
                        cond.box_id,
                        cond.time_of_day,
                        cond.interval_days,
                        cond.start_date,
                        cond.tablet_count,
                        cond.created_at,
                        cond.updated_at,
                        box.name AS name,
                        box.dose AS dose
                    FROM calendars c
                    JOIN medicine_boxes box ON box.calendar_id = c.id
                    JOIN medicine_box_conditions cond ON cond.box_id = box.id
                    WHERE c.id = %s
                """, (calendar_id,))

                rows = cursor.fetchall()
                if not rows:
                    # calendrier inexistant ou aucun médoc -> même retour qu’avant
                    return [], [], None

                calendar_name = rows[0].get("calendar_name")
                # on retire simplement la clé de chaque ligne pour garder EXACTEMENT cond.* + name + dose
                for r in rows:
                    r.pop("calendar_name", None)

                medicines = rows  # déjà sous forme de liste de dicts comme avant
                schedule = generate_schedule(start_date, medicines)
                table = generate_table(start_date, medicines)
                return schedule, table, calendar_name

    except Exception as e:
        logger.error("erreur lors de la génération du calendrier", {
            "origin": "CALENDAR_GENERATE_ERROR",
            "error": str(e),
            "calendar_id": calendar_id
        })
        return [], [], None


def is_medication_due(med, current_date):
    try:
        start_date = med.get("start_date", "")
        if isinstance(start_date, date):
            sd = start_date
        else:
            sd = current_date


        delta_days = (current_date - sd).days

        if delta_days < 0:
            return False

        return delta_days % med["interval_days"] == 0
    except Exception as e:
        logger.error(f"erreur lors de la vérification de la date de prise du médicament: {e}", {
            "origin": "MEDICATION_DUE_ERROR",
            "error": str(e)
        })
        return False


def generate_schedule(start_date, medications):
    monday = start_date - timedelta(days=start_date.weekday())

    total_day = 7 # Nombre de jours à afficher (1 semaine)
    schedule = []

    for i in range(total_day):
        current_date = monday + timedelta(days=i)
        for med in medications:
            if is_medication_due(med, current_date):
                # format pour fullcalendar

                name = med.get('name')
                tablet_count = med.get('tablet_count')
                dose = med.get('dose', None)

                if med["time_of_day"] == "morning":
                    pils_data = {
                        "title" : name,
                        "start" : current_date.strftime("%Y-%m-%dT08:00:00"),
                        "color" : "#f87171", # rouge clair
                        "tablet_count" : tablet_count,
                        "dose" : dose
                    }
                elif med["time_of_day"] == "noon":
                    pils_data = {
                        "title" : name,
                        "start" : current_date.strftime("%Y-%m-%dT12:00:00"),
                        "color" : "#34d399", # vert clair
                        "tablet_count" : tablet_count,
                        "dose" : dose
                    }
                elif med["time_of_day"] == "evening":
                    pils_data = {
                        "title" : name,
                        "start" : current_date.strftime("%Y-%m-%dT18:00:00"),
                        "color" : "#60a5fa", # bleu clair
                        "tablet_count" : tablet_count,
                        "dose" : dose
                    }
                schedule.append(pils_data)
                
    # trier les événements par date et par alphabet
    schedule.sort(key=lambda x: (x["start"], x["title"]))
    return schedule

"""
{
  "morning": [
    {
      "title": "Doliprane",
      "cells": {
        "Mon": 1,
        "Tue": 2
      },
      "dose": "500mg"
    },
    ...
  ],
  "evening": [ ... ]
}


"""
def generate_table(start_date, medications):
    monday = start_date - timedelta(days=start_date.weekday())
    total_day = 7
    table_by_moment = {
        "morning": [],
        "noon": [],
        "evening": []
    }

    for med in medications:
        med_table = build_medication_table(med, monday, total_day)
        if not med_table:
            continue

        moment = med.get("time_of_day")
        if moment not in table_by_moment:
            continue
        merge_or_append_by_moment(table_by_moment[moment], med.get("name"), med_table.get(moment, {}), med.get("dose", None))

    for moment in table_by_moment:
        table_by_moment[moment].sort(key=lambda x: x["title"].lower())
    
    return table_by_moment


def build_medication_table(med, monday, total_day):
    table = {}

    for i in range(total_day):
        current_date = monday + timedelta(days=i)
        if not is_medication_due(med, current_date):
            continue

        day = current_date.strftime("%a")
        moment = med["time_of_day"]
        if moment not in table:
            table[moment] = {}
        table[moment][day] = med["tablet_count"]

    return table


def merge_or_append_by_moment(moment_list, name, cells, dose):
    for entry in moment_list:
        if entry["title"] != name:
            continue

        if entry["dose"] != dose:
            continue

        for day, value in cells.items():
            entry["cells"][day] = entry["cells"].get(day, 0) + value

        return

    # Sinon, on ajoute une nouvelle entrée
    moment_list.append({
        "title": name,
        "cells": cells,
        "dose": dose
    })

def fetch_calendar(calendar_id):
    with get_connection() as conn:
        with conn.cursor() as cursor:
            cursor.execute("SELECT * FROM calendars WHERE id = %s", (calendar_id,))
            calendar = cursor.fetchone() or {}
            return calendar

def fetch_medicine_name(medication_id):
    """
    Récupère le nom d'un médicament à partir de son ID.
    """
    with get_connection() as conn:
        with conn.cursor() as cursor:
            cursor.execute("SELECT name FROM medicine_boxes WHERE id = %s", (medication_id,))
            result = cursor.fetchone() or {}
            return result.get("name", "unknown")
        

def update_stock_decrement_method(calendar_id, method):
    """
    Met à jour la méthode de diminution de stock pour un calendrier.
    """
    with get_connection() as conn:
        with conn.cursor() as cursor:
            cursor.execute("""
                UPDATE calendar_settings
                SET stock_decrement_method = %s
                WHERE calendar_id = %s
            """, (method, calendar_id,))
            conn.commit()
        
def add_pillbox_uses(calendar_id, uid, base_date):
    """Enregistre l'utilisation du pillulier pour la semaine de base_date.

    Table utilisée: pillbox_uses (calendar_id, prepared_at, prepared_by, ...)
    Il n'y a PAS de colonne week_start_date: on contrôle la semaine via prepared_at.

    Retour:
        True si une nouvelle préparation est insérée (aucune entrée cette semaine)
        False si déjà une préparation dans l'intervalle [lundi, lundi+7j)
    """
    
    monday = base_date - timedelta(days=base_date.weekday())
    next_monday = monday + timedelta(days=7)

    with get_connection() as conn:
        with conn.cursor() as cursor:
            cursor.execute(
                """
                WITH ins AS (
                    INSERT INTO pillbox_uses (calendar_id, prepared_at, prepared_by)
                    SELECT %s, %s, %s
                    WHERE NOT EXISTS (
                        SELECT 1
                        FROM pillbox_uses
                        WHERE calendar_id = %s
                          AND prepared_at >= %s
                          AND prepared_at < %s
                    )
                    RETURNING 1 AS inserted
                )
                SELECT COALESCE((SELECT inserted FROM ins), 0) AS result;
                """,
                (calendar_id, base_date, uid, calendar_id, monday, next_monday)
            )
            row = cursor.fetchone() or {"result": 0}
            conn.commit()
            return row.get("result", 0) == 1
    
def get_if_pillbox_is_used(calendar_id, base_date):
    """
    Récupère les enregistrements d'utilisation du pillulier pour un calendrier donné pour une date de base.
    
    retunrne True si utilisé cette semaine, False sinon
    """

    monday = base_date - timedelta(days=base_date.weekday())
    next_monday = monday + timedelta(days=7)

    with get_connection() as conn:
        with conn.cursor() as cursor:
            cursor.execute(
                """
                SELECT 1 AS result
                FROM pillbox_uses
                WHERE calendar_id = %s
                  AND prepared_at >= %s
                  AND prepared_at < %s
                LIMIT 1;
                """,
                (calendar_id, monday, next_monday)
            )
            row = cursor.fetchone() or {"result": 0}
            return row.get("result", 0) == 1