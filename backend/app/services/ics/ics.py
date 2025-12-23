from datetime import datetime, timedelta, date
import uuid
from app.db.connection import get_connection
from app.services.calendar.core import is_medication_due

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
    """Récupère tous les tokens ICS actifs pour un calendrier.
    
    Paramètres:
    - calendar_id (str): L'ID du calendrier.
    - owner_uid (str): L'UID du propriétaire du calendrier.

    Retour:
    - list: Une liste de dictionnaires contenant les informations des tokens actifs.
    """
    with get_connection() as conn:
        with conn.cursor() as cursor:
            cursor.execute("""
                SELECT id, token, created_at, last_accessed_at, last_user_agent
                FROM ics_tokens
                WHERE calendar_id = %s
                    AND owner_uid = %s
                    AND deleted_at IS NULL
                ORDER BY created_at DESC
            """, (calendar_id, owner_uid))
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
                        ) ORDER BY mbc.start_date
                    ) as conditions
                FROM medicine_boxes mb
                JOIN medicine_box_conditions mbc ON mb.id = mbc.box_id
                WHERE mb.calendar_id = %s
                    AND mb.deleted_at IS NULL
                    AND mbc.deleted_at IS NULL
                GROUP BY mb.id, mb.name, mb.stock_quantity, mb.stock_alert_threshold, mb.box_capacity, mb.dose
            """, (calendar_id,))
            
            medicines = cursor.fetchall()
            events = []

            def record_event(var, med, stock, at_date):
                var.append({
                    "date": at_date,
                    "name": med["name"],
                    "stock": stock,
                    "threshold": med["stock_alert_threshold"],
                    "dose": med["dose"],
                    "capacity": med["box_capacity"]
                })
            
            for med in medicines:
                events_temp = []
                today = date.today()
                sunday = today + timedelta(days=(6 - today.weekday()))
                is_active = False
                
                stock = med['stock_quantity']
                if today <= sunday and stock_mode == 'weekly_pillbox':
                    if stock < 0:
                        record_event(events, med, stock, today)
                        stock += med['box_capacity']
                    elif stock <= med['stock_alert_threshold']:
                        record_event(events_temp, med, stock, today)
                        stock += med['box_capacity']
                    today = sunday + timedelta(days=1)
                    
                    
                for day in range(0, 365):
                    check_date = today + timedelta(days=day)
                    
                    for cond in med['conditions']:
                        # Conversion des dates string en objets date
                        cond_parsed = {
                            'interval_days': cond['interval_days'],
                            'start_date': datetime.strptime(cond['start_date'], '%Y-%m-%d').date() if cond.get('start_date') else None,
                            'max_date': datetime.strptime(cond['max_date'], '%Y-%m-%d').date() if cond.get('max_date') else None,
                            'tablet_count': cond['tablet_count']
                        }
                        
                        if is_medication_due(cond_parsed, check_date):
                            is_active = True
                            stock -= cond['tablet_count']
                    
                    # Vérifier si on doit enregistrer une alerte
                    should_alert = stock <= med['stock_alert_threshold']
                    if stock_mode == 'weekly_pillbox':
                        # En mode hebdomadaire, n'alerter que les lundis
                        should_alert = should_alert and check_date.weekday() == 0
                    
                    if should_alert:
                        record_event(events, med, stock, check_date)
                        stock += med['box_capacity']
                
                    
                if is_active:
                    events.extend(events_temp)

    return _generate_ics_content(events, calendar_name).encode('utf-8')

def _generate_ics_content(events: list, calendar_name: str = "MediTime Stocks") -> str:
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
        "X-WR-TIMEZONE:UTC"
    ]
    
    # Date de génération du fichier
    now_str = datetime.utcnow().strftime("%Y%m%dT%H%M%SZ")
    
    for event in events:
        # Format date YYYYMMDD pour les événements "toute la journée"
        dt_start = event['date'].strftime("%Y%m%d")
        # DTEND est exclusif, donc on ajoute 1 jour pour couvrir la journée entière
        dt_end = (event['date'] + timedelta(days=1)).strftime("%Y%m%d")
        uid = str(uuid.uuid4())
        
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
            "STATUS:CONFIRMED",
            "TRANSP:TRANSPARENT", # Indique que cet événement ne bloque pas le temps (disponible)
            "END:VEVENT"
        ])
        
    lines.append("END:VCALENDAR")
    return "\r\n".join(lines)