"""Routes pour la documentation interactive de l'API (Scalar)."""
from pathlib import Path
from flask import Response, send_file
from app.utils.responses import error_response
from . import api

# Recherche du fichier openapi.yaml (priorité: backend/ puis racine MediTime)
_here = Path(__file__).resolve()
_candidate_paths = [
  _here.parents[2] / "openapi.yaml",  # MediTime/backend/openapi.yaml
]
OPENAPI_PATH = next((p for p in _candidate_paths if p.exists()), None)

SCALAR_UI_TEMPLATE = """
<!doctype html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>MediTime API Docs</title>
  <meta name="description" content="Documentation interactive de l'API MediTime - Gestion de médicaments et suivi des traitements">
  <link rel="icon" type="image/png" href="https://meditime-app.com/icons/icon-192x192.png">
  <style>
    body { margin: 0; }
  </style>
</head>
<body>
  <script
    id="api-reference"
    data-url="/api/openapi.yaml"
    data-configuration='{
      "theme": "kepler",
      "layout": "modern",
      "darkMode": true,
      "hideDarkModeToggle": false,
      "searchHotKey": "k",
      "metaData": {
        "title": "MediTime API",
        "description": "API REST pour la gestion de médicaments"
      },
      "hideModels": false,
      "hideDownloadButton": false,
      "customCss": ".darklight-reference-promo { display: none !important; }"
    }'
  ></script>
  <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>
</body>
</html>
"""


@api.route("/docs", methods=["GET"])
def api_docs():
    """Retourne l'UI Scalar alimentée par openapi.yaml."""
    if not OPENAPI_PATH:
        return error_response(
            "Spécification OpenAPI introuvable",
            "openapi_not_found",
            status_code=500,
            error="openapi.yaml absent"
        )
    return Response(SCALAR_UI_TEMPLATE, mimetype="text/html")


@api.route("/openapi.yaml", methods=["GET"])
def openapi_spec():
    """Expose le fichier openapi.yaml pour Swagger UI."""
    if not OPENAPI_PATH:
        return error_response(
            "Spécification OpenAPI introuvable",
            "openapi_not_found",
            status_code=500,
            error="openapi.yaml absent"
        )
    return send_file(OPENAPI_PATH, mimetype="application/yaml")
