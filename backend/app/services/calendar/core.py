from datetime import timedelta, date
from app.utils.logging import log_backend as logger
from app.db.connection import get_connection

def generate_calendar_schedule(calendar_id: str, start_date: date) -> tuple[list, list, str | None]:
    """
    Génère le planning et le tableau de prise de médicaments pour un calendrier donné à partir d'une date de début.
    
    Paramètres:
    - calendar_id (str): L'ID du calendrier.
    - start_date (date): La date de début pour générer le planning.

    Retour:
    - tuple: Un tuple contenant la liste du planning, la liste du tableau de prise, et le nom du calendrier (ou None si non trouvé).
    """
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
                        cond.max_date,
                        cond.tablet_count,
                        cond.created_at,
                        cond.updated_at,
                        box.name AS name,
                        box.dose AS dose
                    FROM calendars c
                    JOIN medicine_boxes box ON box.calendar_id = c.id
                    JOIN medicine_box_conditions cond ON cond.box_id = box.id
                    WHERE c.id = %s
                        AND box.deleted_at IS NULL
                        AND cond.deleted_at IS NULL
                        AND c.deleted_at IS NULL
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


def is_medication_due(med: dict, current_date: date) -> bool:
    """
    Vérifie si un médicament doit être pris à une date donnée.

    Paramètres:
    - med (dict): Dictionnaire contenant les informations du médicament.
    - current_date (date): La date à vérifier.

    Retour:
    - bool: True si le médicament doit être pris à la date donnée, False sinon.
    """
    try:
        start_date = med.get("start_date", "")
        if isinstance(start_date, date):
            sd = start_date
        else:
            sd = current_date

        # Fin de validité optionnelle: max_date est soit une date, soit absent/None
        max_date = med.get("max_date")
        if max_date and current_date > max_date:
            return False

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


def generate_schedule(start_date: date, medications: list[dict]) -> list[dict]:
    """
    Génère le planning des prises de médicaments pour une semaine à partir d'une date de début.

    Paramètres:
    - start_date (date): La date de début pour générer le planning.
    - medications (list[dict]): Liste des médicaments avec leurs informations.

    Retour:
    - list[dict]: Liste des événements de prise de médicaments formatés pour un calendrier.
    """
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
def generate_table(start_date: date, medications: list[dict]) -> dict:
    """
    Génère le tableau des prises de médicaments pour une semaine à partir d'une date de début.

    Paramètres:
    - start_date (date): La date de début pour générer le tableau.
    - medications (list[dict]): Liste des médicaments avec leurs informations.

    Retour:
    - dict: Dictionnaire contenant les tableaux de prise de médicaments par moment de la journée.
    """
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


def build_medication_table(med: dict, monday: date, total_day: int) -> dict:
    """
    Construit le tableau de prise pour un médicament donné sur une semaine.

    Paramètres:
    - med (dict): Dictionnaire contenant les informations du médicament.
    - monday (date): La date du lundi de la semaine.
    - total_day (int): Nombre total de jours dans la semaine.

    Retour:
    - dict: Tableau de prise pour le médicament.
    """

    table = {}

    for i in range(total_day):
        current_date = monday + timedelta(days=i)
        if is_medication_due(med, current_date):

            day = current_date.strftime("%a")
            moment = med["time_of_day"]
            if moment not in table:
                table[moment] = {}
            table[moment][day] = med["tablet_count"]

    return table


def merge_or_append_by_moment(moment_list: list[dict], name: str, cells: dict, dose: str | None):
    """
    Fusionne ou ajoute une entrée dans la liste du moment de la journée.

    Paramètres:
    - moment_list (list[dict]): Liste des entrées pour un moment de la journée.
    - name (str): Nom du médicament.
    - cells (dict): Dictionnaire des prises par jour.
    - dose (str | None): Dose du médicament.
    """
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

def fetch_calendar(calendar_id: str) -> dict:
    """
    Récupère un calendrier à partir de son ID.

    Paramètres:
    - calendar_id (str): L'ID du calendrier.

    Retour:
    - dict: Dictionnaire contenant les informations du calendrier.
    """
    with get_connection() as conn:
        with conn.cursor() as cursor:
            cursor.execute("SELECT * FROM calendars WHERE id = %s AND deleted_at IS NULL", (calendar_id,))
            calendar = cursor.fetchone() or {}
            return calendar

def fetch_medicine_name(medication_id: str) -> str:
    """
    Récupère le nom d'un médicament à partir de son ID.

    Paramètres:
    - medication_id (str): L'ID du médicament.

    Retour:
    - str: Le nom du médicament.
    """
    with get_connection() as conn:
        with conn.cursor() as cursor:
            cursor.execute("SELECT name FROM medicine_boxes WHERE id = %s AND deleted_at IS NULL", (medication_id,))
            result = cursor.fetchone() or {}
            return result.get("name", "unknown")
        

def update_stock_decrement_method(calendar_id: str, method: str):
    """
    Met à jour la méthode de diminution de stock pour un calendrier.

    Paramètres:
    - calendar_id (str): L'ID du calendrier.
    - method (str): La méthode de diminution de stock.
    """
    with get_connection() as conn:
        with conn.cursor() as cursor:
            cursor.execute("""
                UPDATE calendar_settings
                SET stock_decrement_method = %s
                WHERE calendar_id = %s
            """, (method, calendar_id,))
            conn.commit()
        
def add_pillbox_uses(calendar_id: str, uid: str, base_date: date) -> bool:
    """Enregistre l'utilisation du pillulier pour la semaine de base_date.

    Paramètres:
    - calendar_id (str): L'ID du calendrier.
    - uid (str): L'ID de l'utilisateur.
    - base_date (date): La date de base pour la semaine.

    Retour:
    - bool: True si l'enregistrement a été effectué, False sinon.
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
                        AND restored_at IS NULL
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
    
def get_if_pillbox_is_used(calendar_id: str, base_date: date) -> bool:
    """
    Récupère les enregistrements d'utilisation du pillulier pour un calendrier donné pour une date de base.

    Paramètres:
    - calendar_id (str): L'ID du calendrier.
    - base_date (date): La date de base pour la semaine.

    Retour:
    - bool: True si le pillulier a été utilisé cette semaine, False sinon.
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
                    AND restored_at IS NULL
                LIMIT 1;
                """,
                (calendar_id, monday, next_monday)
            )
            row = cursor.fetchone() or {"result": 0}
            return row.get("result", 0) == 1
        
def get_pillbox_uses(calendar_id: str) -> list:
    """
    Récupère les enregistrements d'utilisation du pillulier pour un calendrier donné.

    Paramètres:
    - calendar_id (str): L'ID du calendrier.

    Retour:
    - list: Liste des enregistrements d'utilisation du pillulier.
    """

    with get_connection() as conn:
        with conn.cursor() as cursor:
            cursor.execute(
                """
                SELECT 
                    pu.id,
                    pu.calendar_id,
                    pu.prepared_at,
                    pu.created_at,
                    pu.updated_at,
                    (
                        SELECT jsonb_build_object(
                            'id', pu.prepared_by,
                            'display_name', p.display_name,
                            'photo_url', p.photo_url
                        )
                        FROM get_public_user_info(pu.prepared_by) p
                    ) as prepared_by
                FROM pillbox_uses pu
                WHERE pu.calendar_id = %s
                    AND pu.restored_at IS NULL
                ORDER BY pu.prepared_at DESC;
                """,
                (calendar_id,)
            )
            rows = cursor.fetchall() or []
            return rows

def delete_pillbox_use(calendar_id: str, use_id: str) -> bool:
    """
    Supprime un enregistrement d'utilisation du pillulier pour un calendrier donné.

    Paramètres:
    - calendar_id (str): L'ID du calendrier.
    - use_id (str): L'ID de l'enregistrement d'utilisation du pillulier.

    Retour:
    - bool: True si la suppression a été effectuée, False sinon.
    """
    from app.services.medication.pillbox import restore_pillbox

    with get_connection() as conn:
        with conn.cursor() as cursor:
            # recuperer la date de l'enregistrement pour vérification et suppression cette enregistrement
            cursor.execute(
                "SELECT prepared_at FROM pillbox_uses WHERE id = %s AND calendar_id = %s AND restored_at IS NULL",
                (use_id, calendar_id)
            )
            row = cursor.fetchone()
            if not row:
                return False
            
            prepared_at = row.get('prepared_at')
            prepared_at = prepared_at.date()

            if restore_pillbox(calendar_id, prepared_at):
                cursor.execute(
                    "UPDATE pillbox_uses SET restored_at = NOW() WHERE id = %s",
                    (use_id,)
                )
            else:
                return False
            conn.commit()
            
            # Restaurer le stock des médicaments utilisés pour cette semaine
    return True