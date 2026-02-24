from cloudinary.uploader import upload
from werkzeug.datastructures import FileStorage

def upload_logo(file: FileStorage) -> str | None:
    """Télécharge un logo sur Cloudinary et retourne l'URL sécurisée.

    Paramètres:
    - file (FileStorage): Objet FileStorage représentant le fichier à télécharger.

    Retour:
    - str | None: URL sécurisée du logo téléchargé ou None en cas d'erreur.
    """
    try:
        
        result = upload(file)   
        
        return result["secure_url"]

    except Exception as e:
        return None
