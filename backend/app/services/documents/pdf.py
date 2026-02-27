from io import BytesIO
from app.services.medication import get_medicines_for_calendar
from app.utils import pdf_template
from app.services.notifications import fetch_calendar_name

def generate_medicine_conditions_pdf(calendar_id: str, include_inactive: bool) -> BytesIO:
    """Génère un PDF listant les conditions de prise des médicaments d'un calendrier.

    Paramètres:
    - calendar_id (str): L'ID du calendrier.

    Retour:
    - BytesIO: Le flux binaire du PDF généré.
    """
    # Nouvelle forme: liste triée de [{box_id: {name, dose, conditions}}, ...]
    medicines_list = get_medicines_for_calendar(calendar_id)
    user_name = "MediTime" #TODO: Récupérer le nom de l'utilisateur à partir du calendrier
    calendar_name = fetch_calendar_name(calendar_id)
    
    return pdf_template(medicines_list, user_name, calendar_name, include_inactive)
