from datetime import datetime, timedelta, date
import uuid
from app.db.connection import get_connection
from app.services.calendar.core import is_medication_due
from app.config import Config

FRONTEND_URL = Config.FRONTEND_URL

def create_ics_token(calendar_id: str, owner_uid: str) -> dict:
    """
    Crée un nouveau token d'accès ICS pour un calendrier.
    
    Paramètres:
    - calendar_id (str): L'ID du calendrier pour lequel créer le token.
    - owner_uid (str): L'UID du propriétaire du calendrier.

    Retour:
    - dict: Un dictionnaire contenant les informations du token créé.
    """
    with get_connection() as conn:
        with conn.cursor() as cursor:
            cursor.execute("""
                INSERT INTO ics_tokens (calendar_id, owner_uid)
                VALUES (%s, %s)
                RETURNING id, token, created_at
            """, (calendar_id, owner_uid))
            return cursor.fetchone()

def get_ics_tokens(calendar_id: str, owner_uid: str) -> list:
    """Récupère tous les tokens ICS actifs pour un calendrier avec les infos du propriétaire.
    
    Paramètres:
    - calendar_id (str): L'ID du calendrier.
    - owner_uid (str): L'UID du propriétaire du calendrier.

    Retour:
    - list: Une liste de dictionnaires contenant les informations des tokens actifs avec les infos du propriétaire.
    """
    with get_connection() as conn:
        with conn.cursor() as cursor:
            cursor.execute("""
                SELECT 
                    it.id, 
                    it.token, 
                    it.created_at, 
                    it.last_accessed_at, 
                    it.last_user_agent, 
                    it.owner_uid,
                    u.display_name as owner_display_name,
                    u.photo_url as owner_photo_url,
                    u.email as owner_email
                FROM ics_tokens it
                LEFT JOIN users u ON it.owner_uid = u.id
                WHERE it.calendar_id = %s
                    AND it.deleted_at IS NULL
                ORDER BY it.created_at DESC
            """, (calendar_id,))
            return cursor.fetchall()

def delete_ics_token(token_id: str, owner_uid: str) -> bool:
    """Révoque un token ICS (soft delete).
    
    Paramètres:
    - token_id (str): L'ID du token à révoquer.
    - owner_uid (str): L'UID du propriétaire du token.

    Retour:
    - bool: True si le token a été révoqué, False sinon.
    """
    with get_connection() as conn:
        with conn.cursor() as cursor:
            cursor.execute("""
                UPDATE ics_tokens
                SET deleted_at = COALESCE(deleted_at, NOW())
                WHERE id = %s
                    AND owner_uid = %s
                    AND deleted_at IS NULL
                RETURNING id
            """, (token_id, owner_uid))
            return cursor.fetchone() is not None

def record_event(var, med, stock, at_date):
    var.append({
        "date": at_date,
        "name": med["name"],
        "stock": stock,
        "threshold": med["stock_alert_threshold"],
        "dose": med["dose"],
        "capacity": med["box_capacity"],
        "box_id": med["id"]
    })
        
def check_initial_stock(med, stock, events, events_temp, day):
    if stock < 0:
        record_event(events, med, stock, date.today())
        stock += med['box_capacity']
    elif stock <= med['stock_alert_threshold']:
        record_event(events_temp, med, stock, day)
        stock += med['box_capacity']

def create_calendar_ics(token: str, user_agent: str) -> bytes:
    """Crée un calendrier ICS pour un token donné.
    
    Calcule la date prévisionnelle de rupture de stock pour chaque médicament
    et génère un événement calendrier.

    Paramètres:
    - token (str): Le token d'accès au calendrier (table ics_tokens).
    - user_agent (str): Le User-Agent du client qui demande le calendrier.

    Retour:
    - bytes: Le contenu du fichier .ics encodé en UTF-8.
    """
    
    with get_connection() as conn:
        with conn.cursor() as cursor:
            # 1. Valider le token, mettre à jour l'accès et récupérer le calendar_id en une seule requête
            # On injecte le token en session pour passer le RLS
            cursor.execute("""
                WITH set_session AS (
                    SELECT set_config('app.current_ics_token', %s, true)
                )
                UPDATE ics_tokens
                SET last_accessed_at = NOW(), last_user_agent = %s
                FROM calendars, set_session, calendar_settings
                WHERE ics_tokens.token = %s 
                    AND ics_tokens.deleted_at IS NULL
                    AND ics_tokens.calendar_id = calendars.id
                RETURNING ics_tokens.calendar_id, calendars.name, calendar_settings.stock_decrement_method
            """, (token, user_agent, token))
            
            result = cursor.fetchone()
            
            if not result:
                # Si le token n'existe pas ou est révoqué
                raise ValueError("Token invalide ou révoqué")
            
            calendar_id = result['calendar_id']
            calendar_name = result['name']
            stock_mode = result['stock_decrement_method']
            
            # 2. Récupérer les médicaments avec leurs conditions groupées
            # Le RLS va filtrer via app.current_ics_token injecté précédemment (la session persiste dans la transaction)
            # get pillbox_uses for calendar_id create table public.pillbox_uses
            cursor.execute("""
                SELECT 
                    mb.id, 
                    mb.name, 
                    mb.stock_quantity, 
                    mb.stock_alert_threshold, 
                    mb.box_capacity,
                    mb.dose,
                    json_agg(
                        json_build_object(
                            'interval_days', mbc.interval_days,
                            'start_date', to_char(mbc.start_date, 'YYYY-MM-DD'),
                            'max_date', to_char(mbc.max_date, 'YYYY-MM-DD'),
                            'tablet_count', mbc.tablet_count
                        )
                        ORDER BY mbc.start_date
                    ) AS conditions,
                    COALESCE(pbu_agg.pillbox_uses, '[]'::json) AS pillbox_uses
                FROM medicine_boxes mb
                JOIN medicine_box_conditions mbc ON mb.id = mbc.box_id
                LEFT JOIN (
                    SELECT 
                        calendar_id,
                        json_agg(
                            json_build_object(
                                'prepared_at', to_char(prepared_at, 'YYYY-MM-DD')
                            )
                            ORDER BY prepared_at DESC
                        ) AS pillbox_uses
                    FROM pillbox_uses
                    GROUP BY calendar_id
                ) pbu_agg ON pbu_agg.calendar_id = mb.calendar_id
                WHERE mb.calendar_id = %s
                  AND mb.deleted_at IS NULL
                  AND mbc.deleted_at IS NULL
                GROUP BY 
                    mb.id, mb.name, mb.stock_quantity, mb.stock_alert_threshold, mb.box_capacity, mb.dose,
                    pbu_agg.pillbox_uses;
            """, (calendar_id,))
            
            medicines = cursor.fetchall()
            events = []
            
            for med in medicines:
                events_temp = [] # événements temporaires pour ce médicament, à valider à la fin de la boucle
                first_day = date.today() # jour de départ pour la simulation, par défaut aujourd'hui
                max_day_used = date.today() # date du check de stock initial, par défaut aujourd'hui
                is_active = False # indique si le médicament est actif
                stock = med['stock_quantity'] # stock initial du médicament
                
                if stock_mode == 'weekly_pillbox':
                    # Si on est en mode hebdomadaire, max_day_used est le dimanche de la semaine de la dernière préparation et first_day le lundi suivant
                    day_used = max(datetime.strptime(p['prepared_at'], '%Y-%m-%d').date() for p in med['pillbox_uses'])
                    max_day_used = day_used + timedelta(days=6 - day_used.weekday())  # dimanche de la semaine de la dernière préparation
                    first_day = max_day_used + timedelta(days=1)
                    
                # check du stock init 
                check_initial_stock(med, stock, events, events_temp, max_day_used)
                
                # Simulation jour par jour pour les 365 prochains jours
                for day in range(0, 365):
                    check_date = first_day + timedelta(days=day)
                    
                    for cond in med['conditions']:
                        # Conversion des dates string en objets date
                        cond_parsed = {
                            'interval_days': cond['interval_days'],
                            'start_date': datetime.strptime(cond['start_date'], '%Y-%m-%d').date() if cond.get('start_date') else None,
                            'max_date': datetime.strptime(cond['max_date'], '%Y-%m-%d').date() if cond.get('max_date') else None,
                            'tablet_count': cond['tablet_count']
                        }
                        
                        # Vérifier si le médicament est dû à la date de check
                        if is_medication_due(cond_parsed, check_date):
                            is_active = True
                            stock -= cond['tablet_count']
                    
                    # Vérifier si on doit enregistrer une alerte
                    should_alert = stock <= med['stock_alert_threshold']
                    if stock_mode == 'weekly_pillbox':
                        # En mode hebdomadaire, n'alerter que les lundis
                        should_alert = should_alert and check_date.weekday() == 0
                    
                    if should_alert:
                        record_event(events_temp, med, stock, check_date)
                        stock += med['box_capacity']
                
                    
                if is_active:
                    events.extend(events_temp)

    return _generate_ics_content(events, calendar_name, calendar_id).encode('utf-8')

def _generate_ics_content(events: list, calendar_name: str = "MediTime Stocks", calendar_id: int = 0) -> str:
    """Génère le contenu textuel au format iCalendar (ICS).
    
    Paramètres:
    - events (list): Liste des événements à inclure dans le calendrier.
    - calendar_name (str): Le nom du calendrier.
    
    Retour:
    - str: Le contenu du fichier .ics."""
    lines = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//MediTime//Medicines//FR",
        "CALSCALE:GREGORIAN",
        "METHOD:PUBLISH",
        f"X-WR-CALNAME:{calendar_name} - Stocks",
        "X-WR-TIMEZONE:UTC",
        "X-PUBLISHED-TTL:PT6H",
        "REFRESH-INTERVAL;VALUE=DURATION:PT6H"
    ]
    
    # Date de génération du fichier
    now_str = datetime.utcnow().strftime("%Y%m%dT%H%M%SZ")
    
    for event in events:
        # Format date YYYYMMDD pour les événements "toute la journée"
        dt_start = event['date'].strftime("%Y%m%d")
        
        # DTEND est exclusif, donc on ajoute 1 jour pour couvrir la journée entière
        dt_end = (event['date'] + timedelta(days=1)).strftime("%Y%m%d")
        
        # UID = {box_id}-{YYYYMMDD}@meditime
        uid = f"{event['box_id']}-{event['date'].strftime('%Y%m%d')}@meditime"
        
        summary = f"💊 {event['name']}"
        if event.get('dose'):
            summary += f" ({event['dose']} mg)"
            
        description = f"Stock estimé: {event['stock']:.2f} (Seuil: {event['threshold']})\\nCapacité boîte: {event['capacity']}"
        
        lines.extend([
            "BEGIN:VEVENT",
            f"UID:{uid}",
            f"DTSTAMP:{now_str}",
            f"DTSTART;VALUE=DATE:{dt_start}",
            f"DTEND;VALUE=DATE:{dt_end}",
            f"SUMMARY:{summary}",
            f"DESCRIPTION:{description}",
            f"URL:{FRONTEND_URL}/calendar/{calendar_id}/boxes",
            "STATUS:CONFIRMED",
            "TRANSP:TRANSPARENT",
            "END:VEVENT"
        ])
        
    lines.append("END:VCALENDAR")
    # Joindre avec CRLF et ajouter CRLF final
    return "\r\n".join(lines) + "\r\n"