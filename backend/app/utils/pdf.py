from io import BytesIO
from datetime import datetime, date
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Image,
    Table,
    TableStyle,
    HRFlowable,
    KeepTogether,
    ListFlowable,
    ListItem,
)
from reportlab.lib import colors
from reportlab.lib.units import mm
import os
import tempfile
import requests
from app.config.config import Config

moment_map = {
    "morning": "matin",
    "noon": "midi",
    "evening": "soir",
    "night": "nuit",
}

# Palette simple et pro (cohérente partout)
PALETTE = {
    "primary": colors.HexColor("#0070FF"),   # bleu profond
    "muted": colors.HexColor("#64748B"),     # gris/bleu
    "border": colors.HexColor("#CBD5E1"),    # gris clair
    "bg": colors.HexColor("#F8FAFC"),        # fond très clair
    "active": colors.HexColor("#0F766E"),    # teal
    "inactive": colors.HexColor("#B91C1C"),  # rouge
    "active_bg": colors.HexColor("#ECFEFF"), # teal très clair
    "inactive_bg": colors.HexColor("#FEF2F2")# rouge très clair
}

FONT_REGULAR, FONT_BOLD = "Helvetica", "Helvetica-Bold"

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
    if isinstance(val, datetime):
        return val.date()
    if isinstance(val, date):
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
    if any(u in s.lower() for u in ("mg", "µg", "mcg", "g", "ml", "u", "ui")):
        return s
    return f"{s} mg"

def _format_condition_text(cond: dict, dose_str: str) -> str:
    """
    Formate le texte d'une condition.

    Paramètres:
    - cond (dict): La condition à formater.
    - dose_str (str): La dose formatée du médicament.
    """
    tablet_count = cond.get("tablet_count")
    interval_days = cond.get("interval_days")
    moment_key = cond.get("time_of_day")
    moment_txt = moment_map.get(moment_key, moment_key or "moment")
    start_txt = _fmt_date(cond.get("start_date"))
    max_txt = _fmt_date(cond.get("max_date"))

    # Ex: "1 comprimé(s) — 500 mg — tous les 2 jours — le matin — du 01/01/2026 au 10/02/2026"
    base = f"{tablet_count if tablet_count is not None else '?'} comprimé(s)"
    if dose_str:
        base += f" — {dose_str}"

    if interval_days == 1:
        base += " — tous les jours"
    elif interval_days:
        base += f" — tous les {interval_days} jours"

    if moment_txt:
        base += f" — le {moment_txt}"

    if start_txt and max_txt:
        base += f" — du {start_txt} au {max_txt}"
    elif start_txt:
        base += f" — à partir du {start_txt}"
    elif max_txt:
        base += f" — jusqu'au {max_txt}"

    return base

def process_medicine_item(medicines_list: dict):
    """
    Traite tout les élément de médicament et l'ajoute aux éléments du PDF.

    Paramètres:
    - med_data (dict): Les données du médicament.
    - styles: Les styles de paragraphe.
    - elements (list): La liste des éléments du PDF.
    """
    med_active = []
    med_inactive = []

    for item in medicines_list:
        _, med_data = next(iter(item.items()))
        conditions = med_data.get("conditions", []) or []
        active = False
        today = date.today()

        for cond in conditions:
            start_date = _parse_date(cond.get("start_date"))
            max_date = _parse_date(cond.get("max_date"))
            if not start_date or start_date <= today:
                if not max_date or max_date >= today:
                    active = True
                    break

        if active:
            med_active.append(med_data)
        else:
            med_inactive.append(med_data)

    # Tri alphabétique pour un rendu "pro" et stable
    med_active.sort(key=lambda m: (m.get("name") or "").lower())
    med_inactive.sort(key=lambda m: (m.get("name") or "").lower())

    return med_active, med_inactive


def _build_medicine_card(name: str, dose_str: str, conditions: list, styles: dict, is_active: bool):
    """
    Construit une "carte" (Table) pour un médicament.
    IMPORTANT: une carte par médicament => cassable entre pages (pas un méga-bloc).
    """
    # Titre médicament + dose en couleur "muted"
    muted_hex = "#" + PALETTE["muted"].hexval()[2:]  # format accepté dans <font color='...'>
    med_title = f"{name}"
    if dose_str:
        med_title += f"  <font color='{muted_hex}' size='9'>({dose_str})</font>"

    title_p = Paragraph(med_title, styles["MedTitle"])

    if not conditions:
        cond_flow = Paragraph("Aucune condition définie.", styles["Muted"])
    else:
        items = []
        for cond in conditions:
            desc = _format_condition_text(cond, dose_str)
            items.append(ListItem(Paragraph(desc, styles["Condition"]), leftIndent=10))

        cond_flow = ListFlowable(
            items,
            bulletType="bullet",
            start="•",
            leftIndent=10,
            bulletFontName=FONT_BOLD,
            bulletFontSize=9,
            bulletOffsetY=0,
        )

    bg = PALETTE["active_bg"] if is_active else PALETTE["inactive_bg"]
    border = PALETTE["active"] if is_active else PALETTE["inactive"]

    card = Table([[title_p], [cond_flow]], colWidths=[None])
    card.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), colors.white),
        ("BOX", (0, 0), (-1, -1), 0.9, border),
        ("LINEBELOW", (0, 0), (-1, 0), 0.6, PALETTE["border"]),
        ("BACKGROUND", (0, 0), (-1, 0), bg),  # header couleur douce
        ("LEFTPADDING", (0, 0), (-1, -1), 10),
        ("RIGHTPADDING", (0, 0), (-1, -1), 10),
        ("TOPPADDING", (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ]))

    # KeepTogether seulement sur une carte (c'est petit => ok)
    return KeepTogether([card, Spacer(1, 8)])

def pdf_template(medicines_list: list, user_name: str = "MediTime", calendar_name: str = "Calendrier", include_inactive: bool = True) -> bytes:
    """
    Génère un PDF à partir de la liste de médicaments.

    Paramètres:
    - medicines_list (list): Liste des médicaments à inclure dans le PDF.

    Retourne:
    - bytes: Le contenu du PDF généré.
    """
    buffer = BytesIO()
    today_str = date.today().strftime("%d/%m/%Y")

    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        leftMargin=20 * mm,
        rightMargin=20 * mm,
        topMargin=22 * mm,
        bottomMargin=18 * mm,
        title="Conditions de prise des médicaments",
        author="MediTime",
    )

    base_styles = getSampleStyleSheet()

    # Styles pro (cohérents, simples, lisibles)
    styles = {
        "Title": ParagraphStyle(
            "Title",
            parent=base_styles["Title"],
            fontName=FONT_BOLD,
            fontSize=18,
            leading=22,
            textColor=PALETTE["primary"],
            alignment=1,  # center
            spaceAfter=4,
        ),
        "Subtitle": ParagraphStyle(
            "Subtitle",
            parent=base_styles["Normal"],
            fontName=FONT_REGULAR,
            fontSize=10,
            leading=14,
            textColor=PALETTE["muted"],
            alignment=1,
            spaceAfter=10,
        ),
        "SectionTitleActive": ParagraphStyle(
            "SectionTitleActive",
            parent=base_styles["Heading2"],
            fontName=FONT_BOLD,
            fontSize=12.5,
            leading=16,
            textColor=PALETTE["active"],
            spaceBefore=8,
            spaceAfter=2,
        ),
        "SectionTitleInactive": ParagraphStyle(
            "SectionTitleInactive",
            parent=base_styles["Heading2"],
            fontName=FONT_BOLD,
            fontSize=12.5,
            leading=16,
            textColor=PALETTE["inactive"],
            spaceBefore=10,
            spaceAfter=2,
        ),
        "MedTitle": ParagraphStyle(
            "MedTitle",
            parent=base_styles["Normal"],
            fontName=FONT_BOLD,
            fontSize=10.5,
            leading=13.5,
            textColor=colors.black,
            spaceBefore=0,
            spaceAfter=0,
        ),
        "Condition": ParagraphStyle(
            "Condition",
            parent=base_styles["Normal"],
            fontName=FONT_REGULAR,
            fontSize=9.5,
            leading=12.5,
            textColor=colors.black,
        ),
        "Muted": ParagraphStyle(
            "Muted",
            parent=base_styles["Normal"],
            fontName=FONT_REGULAR,
            fontSize=9.5,
            leading=12.5,
            textColor=PALETTE["muted"],
        ),
        "SmallMuted": ParagraphStyle(
            "SmallMuted",
            parent=base_styles["Normal"],
            fontName=FONT_REGULAR,
            fontSize=8.5,
            leading=11,
            textColor=PALETTE["muted"],
        ),
    }

    elements = []



    elements.append(Paragraph(f"Médicaments du calendrier '{calendar_name}'", styles["Title"]))
    elements.append(Spacer(1, 6))

    elements.append(HRFlowable(width="100%", thickness=1, color=PALETTE["border"], spaceBefore=4, spaceAfter=10))

    actives_med, inactive_med = process_medicine_item(medicines_list)

    # SECTION ACTIFS (plus de Table géante !)
    if actives_med:
        elements.append(Paragraph("Médicaments actifs", styles["SectionTitleActive"]))
        elements.append(Paragraph(f"{len(actives_med)} médicament(s)", styles["SmallMuted"]))
        elements.append(Spacer(1, 8))

        for med in actives_med:
            name = med.get("name", "Sans nom")
            dose_str = _fmt_dose(med.get("dose"))
            conditions = med.get("conditions", []) or []
            elements.append(_build_medicine_card(name, dose_str, conditions, styles, True))

        elements.append(Spacer(1, 6))

    # SECTION INACTIFS
    if inactive_med and include_inactive:
        elements.append(Paragraph("Médicaments inactifs", styles["SectionTitleInactive"]))
        elements.append(Paragraph(f"{len(inactive_med)} médicament(s)", styles["SmallMuted"]))
        elements.append(Spacer(1, 8))

        for med in inactive_med:
            name = med.get("name", "Sans nom")
            dose_str = _fmt_dose(med.get("dose"))
            conditions = med.get("conditions", []) or []
            elements.append(_build_medicine_card(name, dose_str, conditions, styles, False))

        elements.append(Spacer(1, 6))

    # Note bas de doc
    elements.append(Spacer(1, 8))
    elements.append(HRFlowable(width="100%", thickness=0.8, color=PALETTE["border"], spaceBefore=6, spaceAfter=6))
    elements.append(Paragraph(
        "Ce document est fourni à titre informatif. En cas de doute, référez-vous à l’ordonnance et aux recommandations du professionnel de santé.",
        styles["SmallMuted"]
    ))

    # Télécharge le logo depuis l'URL du frontend
    logo_url = f"{Config.FRONTEND_URL}/icons/logo.png"
    logo_path = None
    try:
        resp = requests.get(logo_url, timeout=5)
        if resp.status_code == 200:
            tmp = tempfile.NamedTemporaryFile(suffix=".png", delete=False)
            tmp.write(resp.content)
            tmp.close()
            logo_path = tmp.name
    except Exception:
        logo_path = None

    generated_str = f"Généré le {today_str} par {user_name}"

    def header_footer_with_logo(canvas, doc):
        canvas.saveState()
        page_w, page_h = A4
        left = doc.leftMargin
        right = page_w - doc.rightMargin
        top = page_h - doc.topMargin
        bottom = doc.bottomMargin

        # Header line
        canvas.setStrokeColor(PALETTE["border"])
        canvas.setLineWidth(0.8)
        canvas.line(left, top + 10, right, top + 10)

        # Logo à gauche dans le header
        if logo_path and os.path.exists(logo_path):
            try:
                img = Image(logo_path)
                max_h = 10 * mm * 1.5
                iw, ih = img.imageWidth, img.imageHeight
                ratio = max_h / ih if ih else 1
                w = iw * ratio
                h = ih * ratio
                x = left  # aligné à gauche
                y = top + 12
                img.drawWidth = w
                img.drawHeight = h
                img.drawOn(canvas, x, y)
            except Exception:
                pass

        # Date à droite
        canvas.setFont(FONT_REGULAR, 8.5)
        canvas.setFillColor(PALETTE["muted"])
        canvas.drawRightString(right, top + 16, generated_str)

        # Footer line
        canvas.setStrokeColor(PALETTE["border"])
        canvas.setLineWidth(0.8)
        canvas.line(left, bottom - 10, right, bottom - 10)

        # Footer text + page number
        canvas.setFillColor(PALETTE["muted"])
        canvas.setFont(FONT_REGULAR, 8.5)
        canvas.drawString(left, bottom - 22, "MediTime — Document généré automatiquement")
        page_num = canvas.getPageNumber()
        canvas.drawRightString(right, bottom - 22, f"Page {page_num}")
        canvas.restoreState()

    doc.build(
        elements,
        onFirstPage=header_footer_with_logo,
        onLaterPages=header_footer_with_logo,
    )

    # Nettoyage du fichier temporaire du logo
    if logo_path:
        try:
            os.unlink(logo_path)
        except OSError:
            pass

    return buffer.getvalue() if hasattr(buffer, "getvalue") else (buffer if isinstance(buffer, bytes) else bytes(buffer))