from io import BytesIO
from datetime import datetime, date
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from app.services.medication import get_medicines_for_calendar

moment_map = {
    "morning": "matin",
    "noon": "midi",
    "evening": "soir",
    "night": "nuit",
}

def _parse_date(val: str | date | datetime | None) -> date | None:
    """Parse une chaîne de caractères en date.
    Peut gérer les objets date et datetime en les retournant tels quels.

    Paramètres:
    - val (str | date | datetime | None): La valeur à parser en date.

    Retour:
    - date | None: La date parsée ou None si la conversion échoue.
    """
    if not val:
        return None
    if isinstance(val, (datetime, date)):
        return val
    # Essais formats courants
    for fmt in ("%Y-%m-%d",):
        try:
            return datetime.strptime(val, fmt).date()
        except ValueError:
            continue  # Format non valide, essayer le suivant
    try:
        return datetime.fromisoformat(val).date()
    except (ValueError, TypeError):
        return None

def _fmt_date(val: str | date | datetime | None) -> str | None:
    """Formate une date en chaîne au format JJ/MM/AAAA.

    Paramètres:
    - val (str | date | datetime | None): La valeur à formater.

    Retour:
    - str | None: La date formatée ou None si la conversion échoue.
    """
    d = _parse_date(val)
    return d.strftime("%d/%m/%Y") if d else None

def _fmt_dose(dose: str | int | float | None) -> str:
    """Formate une dose en chaîne avec unité mg si aucune unité n'est spécifiée.

    Paramètres:
    - dose: La dose à formater.

    Retour:
    - str: La dose formatée en chaîne.
    """
    if dose is None or dose == "":
        return ""
    s = str(dose).strip()
    if any(u in s.lower() for u in ("mg", "µg", "mcg", "g", "ml", "u")):
        return s
    return f"{s} mg"

def generate_medicine_conditions_pdf(calendar_id: str) -> BytesIO:
    """Génère un PDF listant les conditions de prise des médicaments d'un calendrier.

    Paramètres:
    - calendar_id (str): L'ID du calendrier.

    Retour:
    - BytesIO: Le flux binaire du PDF généré.
    """
    # Nouvelle forme: liste triée de [{box_id: {name, dose, conditions}}, ...]
    medicines_list = get_medicines_for_calendar(calendar_id)

    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4)
    styles = getSampleStyleSheet()
    elements = []

    elements.append(Paragraph("Conditions de prise des médicaments", styles['Heading1']))
    elements.append(Spacer(1, 12))

    # On respecte l'ordre déjà trié par SQL (par name)
    for item in medicines_list:
        # item = {"<box_id>": {...}}
        _, med_data = next(iter(item.items()))
        name = med_data.get("name", "Sans nom")
        dose_str = _fmt_dose(med_data.get("dose"))
        conditions = med_data.get("conditions", []) or []

        title = f"<b>{name}{f' ({dose_str})' if dose_str else ''}</b>"
        elements.append(Paragraph(title, styles['Heading3']))

        if not conditions:
            elements.append(Paragraph("- Aucune condition définie", styles['Normal']))
            elements.append(Spacer(1, 10))
            continue

        for cond in conditions:
            tablet_count = cond.get("tablet_count")
            interval_days = cond.get("interval_days")
            moment_key = cond.get("time_of_day")
            moment_txt = moment_map.get(moment_key, moment_key or "moment")
            start_txt = _fmt_date(cond.get("start_date"))

            parts = [f"- {tablet_count if tablet_count is not None else '?'} comprimé(s)"]
            if dose_str:
                parts.append(f"de {dose_str}")
            if interval_days:
                parts.append(f"tous les {interval_days} jour(s)")
            if moment_txt:
                parts.append(f", le {moment_txt}")

            desc = " ".join(parts)
            if start_txt:
                desc += f", à partir du {start_txt}"

            elements.append(Paragraph(desc, styles['Normal']))

        elements.append(Spacer(1, 10))

    doc.build(elements)
    buffer.seek(0)
    return buffer
