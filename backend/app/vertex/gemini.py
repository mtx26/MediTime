import base64
import json
import io
from PIL import Image as PILImage
import pillow_heif
from vertexai.preview.generative_models import GenerativeModel, Image as VertexImage
from app.utils.logging import log_backend

# Enregistre le support HEIF (.heic)
pillow_heif.register_heif_opener()

def load_image_from_bytes(file_bytes: bytes) -> bytes:
    """
    Charge une image à partir de bytes, quel que soit le format (JPG, PNG, HEIC...),
    et retourne une version standardisée au format PNG.

    Paramètres:
    - file_bytes (bytes): Contenu binaire de l'image.
    
    Retour:
    - bytes: Contenu binaire de l'image au format PNG.
    """
    try:
        image = PILImage.open(io.BytesIO(file_bytes)).convert("RGB")
        buffer = io.BytesIO()
        image.save(buffer, format="PNG")
        return buffer.getvalue()
    except Exception as e:
        raise ValueError("Unsupported or corrupted image format") from e


def analyze_medical_document(base64_image: str) -> dict | None:
    """Analyse un document médical scanné via Gemini et extrait les informations des médicaments.

    Paramètres:
    - base64_image (str): Image encodée en base64 du document médical scanné.

    Retour:
    - dict | None: Dictionnaire contenant les informations extraites des médicaments, ou None en cas d'erreur.
    """
    try:
        MODEL_ID = "gemini-2.0-flash-lite"
        model = GenerativeModel(MODEL_ID)

        prompt = """
You are a medical assistant. You receive a scanned medical prescription. Your goal is to extract all the prescribed medications and their treatment instructions into a clean JSON structure.

Return only a raw JSON object. Do not include any Markdown formatting (such as triple backticks). Do not wrap the result. Do not explain anything.

Here is the required format:

{
  "medicine_boxes": [
    {
      "name": "Medication name only (do NOT include dosage)",
      "dose": "Dosage per unit, without unit (e.g. '40', '500'), or null if not specified",
      "conditions": [
        {
          "time_of_day": "morning" , "noon" or "evening" (only in english),
          "interval_days": Number of days between each intake (e.g. 1),
          "start_date": "YYYY-MM-DD" or null if not specified,
          "tablet_count": Number of tablets taken at that time
        }
      ]
    }
  ]
}

Rules:
- "name" must never include the dosage.
- "dose" must be a string with the quantity but without unit (e.g. "40", "500"), or null if not specified. Do not use "N/A".
- "start_date" must be in "YYYY-MM-DD" format or null if unknown.
- Return valid JSON only. Do NOT wrap in Markdown (no ```json).
- Every field must be present in every item.
- If a value is missing, use the literal null (not a string).
        """.strip()

        file_bytes = base64.b64decode(base64_image)
        png_bytes = load_image_from_bytes(file_bytes)
        vertex_image = VertexImage.from_bytes(png_bytes)

        response = model.generate_content([prompt, vertex_image])

        raw_output = ""
        if response.candidates and response.candidates[0].content.parts:
            raw_output = response.candidates[0].content.parts[0].text
        else:
            log_backend.warning("Gemini response structure unexpected", {"origin": "GEMINI_ANALYZE"})
            return None

        cleaned = strip_json_markdown(raw_output)

        try:
            data = json.loads(cleaned)
            medicine_boxes = data.get("medicine_boxes", [])
            return medicine_boxes
        except json.JSONDecodeError as json_error:
            log_backend.warning("Gemini returned non-JSON output", {
                "origin": "GEMINI_ANALYZE",
                "raw_output": raw_output,
                "error": str(json_error)
            })
            return None

    except Exception as e:
        log_backend.exception("Error during Gemini analysis", {
            "origin": "GEMINI_ANALYZE",
            "code": "GEMINI_ERROR",
            "error": str(e)
        })
        return None

def strip_json_markdown(raw: str) -> str:
    """Supprime les balises Markdown d'un texte JSON brut retourné par Gemini.

    Paramètres:
    - raw (str): Texte JSON brut potentiellement encadré par des balises Markdown.

    Retour:
    - str: Texte JSON nettoyé sans balises Markdown.
    """
    if isinstance(raw, str):
        text = raw.strip()
        if text.startswith("```json"):
            text = text[len("```json"):].lstrip()
        if text.endswith("```"):
            text = text[:-3].rstrip()
        return text
    return raw


def test_analyze_medical_document():
    """Fonction de test pour l'analyse d'un document médical scanné via Gemini."""

    IMAGE_PATH = "C:\\Users\\mtx_2\\Downloads\\calendrier_2ef7fcc2.jpg"  # ou .jpg, .png, etc.

    with open(IMAGE_PATH, "rb") as f:
        file_bytes = f.read()
        base64_image = base64.b64encode(file_bytes).decode("utf-8")

    result = analyze_medical_document(base64_image)

    print("=== Résultat brut Gemini ===")
    print(json.dumps(result, indent=2, ensure_ascii=False))
