from app.db.connection import get_connection
import json

def save_analysis_result(owner_uid: str, calendar_name: str, boxes: list) -> str:
    """Enregistre le résultat de l'analyse d'un document en créant un calendrier et ses boîtes de médicaments.
    
    Paramètres:
    - owner_uid (str): L'UID du propriétaire du calendrier.
    - calendar_name (str): Le nom du calendrier.
    - boxes (list): La liste des boîtes de médicaments.

    Retour:
    - str: L'ID du calendrier créé.
    """
    with get_connection() as conn:
        with conn.cursor() as cur:
            # 1. Create Calendar
            cur.execute("""
                INSERT INTO public.calendars (owner_uid, name)
                VALUES (%s, %s)
                RETURNING id
            """, (owner_uid, calendar_name))
            calendar_id = cur.fetchone()['id']
            
            # 2. Process boxes
            for box in boxes:
                name = box.get('name')
                
                dose_val = box.get('dose')
                dose = int(dose_val) if dose_val and str(dose_val).strip() else None
                
                stock_max_val = box.get('stock_max')
                box_capacity = int(stock_max_val) if stock_max_val and str(stock_max_val).strip() else 0
                
                stock_qty_val = box.get('stock_quantity')
                stock_quantity = float(stock_qty_val) if stock_qty_val and str(stock_qty_val).strip() else 0.0
                
                alert_val = box.get('stock_alert_threshold')
                stock_alert_threshold = int(alert_val) if alert_val and str(alert_val).strip() else 0
                
                # Insert Box
                cur.execute("""
                    INSERT INTO public.medicine_boxes 
                    (calendar_id, name, dose, box_capacity, stock_quantity, stock_alert_threshold)
                    VALUES (%s, %s, %s, %s, %s, %s)
                    RETURNING id
                """, (calendar_id, name, dose, box_capacity, stock_quantity, stock_alert_threshold))
                box_id = cur.fetchone()['id']
                
                # 3. Process conditions
                conditions = box.get('conditions', [])
                for cond in conditions:
                    time_of_day = cond.get('time_of_day')
                    
                    interval_val = cond.get('interval_days')
                    interval_days = int(interval_val) if interval_val and str(interval_val).strip() else 0
                    
                    start_date_val = cond.get('start_date')
                    start_date = start_date_val if start_date_val and str(start_date_val).strip() else None
                    
                    tablet_val = cond.get('tablet_count')
                    tablet_count = float(tablet_val) if tablet_val and str(tablet_val).strip() else 0.0
                    
                    cur.execute("""
                        INSERT INTO public.medicine_box_conditions
                        (box_id, time_of_day, interval_days, start_date, tablet_count)
                        VALUES (%s, %s, %s, %s, %s)
                    """, (box_id, time_of_day, interval_days, start_date, tablet_count))
                    
        conn.commit()
        return calendar_id
