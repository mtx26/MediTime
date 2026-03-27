import logging
import os
import sys
from dotenv import load_dotenv

# Charge les variables d'environnement
load_dotenv()


# 🔍 Détection de Railway via variable unique
def is_railway() -> bool:
    """Détecte si l'application s'exécute sur Railway via une variable d'environnement spécifique.

    Retour:
    - bool: True si sur Railway, False sinon.
    """
    return os.environ.get("RAILWAY_ENVIRONMENT", "").lower() == "true"


# === Logger Contextualisé ===
class ContextualAdapter(logging.LoggerAdapter):
    """Adapter de logger pour ajouter un contexte personnalisé aux messages de log."""
    def process(self, msg, kwargs):
        source = self.extra.get("source", "UNKNOWN")
        extra = kwargs.pop("extra", {}) or {}

        origin = extra.pop("origin", "UNKNOWN").upper()
        context = extra
        error = context.pop("error", None)
        stack = context.pop("stack", None)
        code = context.pop("code", None)

        final_msg = f"[{source}] [{origin}] {msg}"
        if code:
            final_msg += f" | Code: {code}"
        if context:
            final_msg += f" | Context: {context}"
        if error:
            final_msg += f" | Error: {error}"
        if stack:
            final_msg += f" | Stack: {stack}"

        return final_msg, kwargs


# === Formatter avec ou sans couleur
class ColoredFileFormatter(logging.Formatter):
    """Formatter de fichier avec coloration conditionnelle selon la source et le niveau de log."""
    def format(self, record):
        raw = super().format(record)
        msg_lower = record.getMessage().lower()
        source = None
        if "[backend]" in msg_lower:
            source = "BACKEND"
        elif "[frontend]" in msg_lower:
            source = "FRONTEND"
        return color_line(raw, source=source, level=record.levelname)


def color_line(text: str, source: str | None = None, level: str | None = None) -> str:
    """Applique une coloration ANSI au texte selon la source ou le niveau de log.

    Paramètres:
    - text (str): Texte à colorer.
    - source (str | None): Source du log (ex: BACKEND, FRONTEND).
    - level (str | None): Niveau de log (ex: ERROR, WARNING).

    Retour:
    - str: Texte coloré avec codes ANSI.
    """
    if is_railway():
        return text  # Pas de couleur sur Railway

    colors = {
        "BACKEND": "\x1b[94m",   # Bleu
        "FRONTEND": "\x1b[93m",  # Jaune
        "ERROR": "\x1b[91m",     # Rouge
        "WARNING": "\x1b[95m",   # Magenta
        "DEBUG": "\x1b[90m",     # Gris clair
        "RESET": "\x1b[0m"
    }

    color = ""
    if level and level.upper() in colors:
        color = colors[level.upper()]
    elif source and source.upper() in colors:
        color = colors[source.upper()]

    return f"{color}{text}{colors['RESET']}"


# === Logger principal
base_logger = logging.getLogger("medic_logger")
base_logger.setLevel(logging.DEBUG)

# Console toujours présente
console_stream = sys.stdout  # Railway exige stdout pour ne pas afficher rouge
console_handler = logging.StreamHandler(console_stream)
console_formatter = ColoredFileFormatter("%(asctime)s [%(levelname)s] %(message)s", "%H:%M:%S")
console_handler.setFormatter(console_formatter)
base_logger.addHandler(console_handler)


# === Loggers contextualisés
backend_logger = ContextualAdapter(base_logger, {"source": "BACKEND"})
frontend_logger = ContextualAdapter(base_logger, {"source": "FRONTEND"})


# === Wrapper dynamique
class DynamicLogWrapper:
    """Wrapper dynamique pour les loggers, permettant d'ajouter du contexte aux appels de log."""
    def __init__(self, base_logger):
        self.base_logger = base_logger

    def __getattr__(self, level):
        def log_method(message, context=None, *, error=None, stack=None):
            full_context = context.copy() if context else {}
            if error:
                full_context["error"] = error
            if stack:
                full_context["stack"] = stack
            logger_func = getattr(self.base_logger, level, self.base_logger.info)
            logger_func(message, extra=full_context)
        return log_method


# === Export des loggers dynamiques
log_backend = DynamicLogWrapper(backend_logger)
log_frontend = DynamicLogWrapper(frontend_logger)
