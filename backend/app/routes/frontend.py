from flask import Blueprint, render_template, request, abort
from app.seo.meta_config import META

SUPPORTED_LANGS = list(META.keys())

frontend = Blueprint('frontend', __name__, template_folder='../templates')

@frontend.route('/', defaults={'path': ''})
@frontend.route('/<path:path>')
def serve_frontend(path):
    if path.startswith('api'):
        abort(404)
    segments = [seg for seg in path.split('/') if seg]
    lang = segments[0] if segments and segments[0] in SUPPORTED_LANGS else 'fr'
    remaining = '/' + '/'.join(segments[1:]) if len(segments) > 1 else '/'
    meta = META.get(lang, META['fr'])
    base = request.url_root.rstrip('/')
    alternates = []
    for l in SUPPORTED_LANGS:
        url = f"{base}/{l}{'' if remaining == '/' else remaining}"
        alternates.append({'lang': l, 'url': url})
    current_url = f"{base}/{lang}{'' if remaining == '/' else remaining}"
    return render_template('index.html.j2', lang=lang, meta=meta, alternates=alternates, current_url=current_url)
