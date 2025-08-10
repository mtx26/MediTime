from flask import Blueprint

api = Blueprint('api', __name__)

# Importer les sous-modules pour enregistrer leurs routes
from .status import *
from .log import *
from .personal import *
from .tokens import *
from .user import *
from .pdf import *
from .gemini import *
from .sharing import *


def register_routes(app):
    app.register_blueprint(api, url_prefix='/api')
