from cloudinary.uploader import upload

def upload_logo(file: str) -> str | None:
    """Télécharge un logo sur Cloudinary et retourne l'URL sécurisée.

    Paramètres:
    - file (str): Chemin du fichier ou URL à télécharger.

    Retour:
    - str | None: URL sécurisée du logo téléchargé ou None en cas d'erreur.
    """
    try:
        
        result = upload(file)   
        
        return result["secure_url"]

    except Exception as e:
        return None
