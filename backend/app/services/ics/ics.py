from datetime import datetime, timedelta, date
import uuid
from app.db.connection import get_connection

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
                WHERE calendar_id = %s AND owner_uid = %s AND revoked_at IS NULL
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
                SET revoked_at = NOW()
                WHERE id = %s AND owner_uid = %s AND revoked_at IS NULL
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
            cursor.execute("""
                UPDATE ics_tokens
                SET last_accessed_at = NOW(), last_user_agent = %s
                FROM calendars
                WHERE ics_tokens.token = %s 
                  AND ics_tokens.revoked_at IS NULL 
                  AND ics_tokens.calendar_id = calendars.id
                RETURNING ics_tokens.calendar_id, calendars.name
            """, (user_agent, token))
            
            result = cursor.fetchone()
            
            if not result:
                # Si le token n'existe pas ou est révoqué
                raise ValueError("Token invalide ou révoqué")
            
            calendar_id = result['calendar_id']
            calendar_name = result['name']
            
            # 2. Récupérer les médicaments ET leurs conditions agrégées en JSON
            cursor.execute("""
                SELECT 
                    mb.id, 
                    mb.name, 
                    mb.stock_quantity, 
                    mb.stock_alert_threshold, 
                    mb.box_capacity,
                    mb.dose,
                    COALESCE(
                        json_agg(
                            json_build_object(
                                'start_date', mbc.start_date,
                                'interval_days', mbc.interval_days,
                                'tablet_count', mbc.tablet_count
                            )
                        ) FILTER (WHERE mbc.id IS NOT NULL), 
                        '[]'
                    ) as conditions
                FROM medicine_boxes mb
                LEFT JOIN medicine_box_conditions mbc ON mb.id = mbc.box_id
                WHERE mb.calendar_id = %s
                GROUP BY mb.id
            """, (calendar_id,))
            
            medicines = cursor.fetchall()
            
            events = []
            today = date.today()
            
            for med in medicines:
                simulated_stock = med['stock_quantity']
                threshold = med['stock_alert_threshold']
                capacity = med['box_capacity']
                name = med['name']
                conditions = med['conditions']
                med_dose = med['dose']
                
                # Si le stock est déjà sous le seuil (ou égal), c'est urgent : événement aujourd'hui
                if simulated_stock <= threshold:
                    events.append({
                        'date': today,
                        'name': name,
                        'stock': simulated_stock,
                        'threshold': threshold,
                        'dose': med_dose,
                        'capacity': capacity
                    })
                    # On simule un rachat immédiat pour voir les prochaines occurrences
                    if capacity > 0:
                        simulated_stock += capacity
                    else:
                        # Si on ne connait pas la capacité de la boîte, on ne peut pas prédire la suite
                        continue
                
                if not conditions:
                    # Si pas de conditions de prise, on ne peut pas prédire la baisse de stock
                    continue
                
                # On simule sur 365 jours maximum
                for day_offset in range(1, 366):
                    current_day = today + timedelta(days=day_offset)
                    daily_consumption = 0
                    
                    for cond in conditions:
                        # La date vient du JSON, c'est donc une string YYYY-MM-DD ou None
                        start_date_str = cond.get('start_date')
                        if start_date_str:
                            start_date = datetime.strptime(start_date_str, '%Y-%m-%d').date()
                        else:
                            start_date = None
                            
                        interval = cond['interval_days']
                        dose = cond['tablet_count']
                        
                        # Si pas de date de début définie, on assume que c'est actif dès aujourd'hui
                        eff_start_date = start_date if start_date else today
                        
                        # Si la condition commence dans le futur, on l'ignore pour l'instant
                        if eff_start_date > current_day:
                            continue
                            
                        # Vérifier si c'est un jour de prise
                        days_diff = (current_day - eff_start_date).days
                        if interval > 0 and days_diff % interval == 0:
                            daily_consumption += dose
                    
                    simulated_stock -= daily_consumption
                    
                    # Si le stock passe sous le seuil (ou l'atteint)
                    if simulated_stock <= threshold:
                        events.append({
                            'date': current_day,
                            'name': name,
                            'stock': simulated_stock,
                            'threshold': threshold,
                            'dose': med_dose,
                            'capacity': capacity
                        })
                        
                        # On simule le rachat d'une boîte
                        if capacity > 0:
                            simulated_stock += capacity
                        else:
                            # Impossible de prédire la prochaine rupture sans connaître la quantité rachetée
                            break

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
        
        summary = f"💊 Racheter {event['name']}"
        if event.get('dose'):
            summary += f" ({event['dose']} mg)"
            
        description = f"Stock estimé: {event['stock']:.1f} (Seuil: {event['threshold']})\\nCapacité boîte: {event['capacity']}"
        
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