from app.db.connection import get_connection
from app.utils.upload import upload_logo
from psycopg2 import sql

def fetch_user(uid: str | None) -> dict:
    """Fetch user from the database by user ID.

    Paramètres:
    - uid (str): ID de l'utilisateur.

    Retour:
    - dict: Dictionnaire représentant l'utilisateur ou vide si non trouvé.
    """
    if uid is None:
        return {}
    with get_connection() as conn:
        with conn.cursor() as cursor:
            cursor.execute("SELECT * FROM users WHERE id = %s", (uid,))
            user = cursor.fetchone() or {}
            return user

def fetch_public_user_info(uid: str) -> dict:
    """Récupère les informations publiques d'un utilisateur (nom, photo) via RPC sécurisé.
    Utilisé pour les notifications et l'affichage public.

    Paramètres:
    - uid (str): ID de l'utilisateur.

    Retour:
    - dict: Dictionnaire avec display_name et photo_url.
    """
    with get_connection() as conn:
        with conn.cursor() as cursor:
            cursor.execute("SELECT display_name, photo_url FROM users WHERE id = %s", (uid,))
            user = cursor.fetchone() or {}
            return user



def update_existing_user(
    uid: str | None,
    user_db: dict,
    display_name: str | None,
    email: str | None,
    photo_url: str | None,
    email_enabled: bool | None,
    push_enabled: bool | None
) -> dict:
    """Met à jour les informations de l'utilisateur existant dans la base de données.

    Paramètres:
    - uid (str | None): ID de l'utilisateur.
    - user_db (dict): Dictionnaire représentant l'utilisateur actuel.
    - display_name (str | None): Nouveau nom d'affichage.
    - email (str | None): Nouvelle adresse e-mail.
    - photo_url (str | None): Nouvelle URL de la photo.
    - email_enabled (bool | None): Activation des e-mails.
    - push_enabled (bool | None): Activation des notifications push.

    Retour:
    - dict: Dictionnaire représentant l'utilisateur mis à jour.
    """
    with get_connection(skip_rls=True) as conn:
        with conn.cursor() as cursor:
            updates = {}

            # Champs simples
            fields = [
                ("display_name", display_name),
                ("email", email),
                ("email_enabled", email_enabled),
                ("push_enabled", push_enabled)
            ]

            for field, value in fields:
                if value is not None and value != user_db[field]:
                    updates[field] = value

            # Cas particulier pour photo_url
            if photo_url is not None and photo_url != user_db["photo_url"]:
                updates["photo_url"] = upload_logo(photo_url)

            if updates:
                cursor.execute(
                    sql.SQL("UPDATE users SET {} WHERE id = %s RETURNING *").format(
                        sql.SQL(", ").join(
                            sql.SQL("{} = %s").format(sql.Identifier(k)) for k in updates.keys()
                        )
                    ),
                    list(updates.values()) + [uid]
                )
                updated_user = cursor.fetchone()
                conn.commit()
                return updated_user

            return user_db

def insert_new_user(uid: str | None, display_name: str, email: str, photo_url: str | None, email_enabled: bool = True, push_enabled: bool = True) -> dict:
    """Insère un nouvel utilisateur dans la base de données.

    Paramètres:
    - uid (str | None): ID de l'utilisateur.
    - display_name (str): Nom d'affichage.
    - email (str): Adresse e-mail.
    - photo_url (str | None): URL de la photo.
    - email_enabled (bool): Activation des e-mails.
    - push_enabled (bool): Activation des notifications push.

    Retour:
    - dict: Dictionnaire représentant l'utilisateur inséré.
    """
    if photo_url is not None:
        photo_url = upload_logo(photo_url)

    with get_connection(skip_rls=True) as conn:
        with conn.cursor() as cursor:
            cursor.execute(
                """
                INSERT INTO users (id, display_name, email, photo_url, email_enabled, push_enabled)
                VALUES (%s, %s, %s, %s, %s, %s)
                """,
                (uid, display_name, email, photo_url, email_enabled, push_enabled)
            )
            conn.commit()

            return fetch_user(uid)