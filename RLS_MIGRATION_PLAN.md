# Plan de migration RLS pour MediTime

Ce document analyse l'impact de l'activation du RLS (Row Level Security) sur le backend Flask et propose un plan d'action.

## 1. Analyse des usages de `get_connection`

Le backend utilise `get_connection()` à de nombreux endroits. Grâce à la modification récente, `get_connection()` utilise automatiquement `g.uid` s'il est disponible (c'est-à-dire dans les routes authentifiées).

### ✅ Cas compatibles (Automatiques)
Ces services sont appelés depuis des routes protégées par `@require_auth`. `g.uid` sera présent, donc le RLS s'appliquera automatiquement.

*   **`app/services/user.py`** :
    *   `fetch_user(uid)` : OK.
    *   `update_existing_user(...)` : OK.
    *   `insert_new_user(...)` : OK.
*   **`app/services/medication/boxes.py`** :
    *   `get_boxes(calendar_id)` : OK. L'utilisateur ne verra que les boîtes des calendriers qu'il possède (grâce à la policy `Users can view boxes of own calendars`).
    *   `update_box(...)` : OK.
*   **`app/services/medication/stock.py`** :
    *   Gestion des stocks : OK.
*   **`app/services/medication/pillbox.py`** :
    *   Gestion des piluliers : OK.
*   **`app/services/ics/ics.py`** :
    *   Export ICS : OK.

### ⚠️ Cas particuliers (À vérifier)

Certains usages nécessitent une attention particulière car ils peuvent être exécutés hors contexte utilisateur ou nécessiter des droits élevés.

1.  **Notifications (`app/services/notifications/core.py`)** :
    *   L'envoi de notifications peut se faire en tâche de fond ou via des triggers.
    *   Si c'est déclenché par une action utilisateur (ex: "Envoyer une invitation"), `g.uid` est là -> OK.
    *   Si c'est une tâche CRON (ex: rappel de prise de médicament), il n'y a pas de `g.uid`.
        *   **Solution** : Le code actuel de `get_connection` gère ça : si pas de `g.uid`, pas de RLS (mode admin). C'est le comportement souhaité pour le système.

2.  **Création de compte (`insert_new_user`)** :
    *   Lorsqu'un utilisateur s'inscrit, il n'existe pas encore en base.
    *   La policy `INSERT` sur `users` doit permettre à un utilisateur authentifié (via Supabase Auth) de créer sa propre ligne.
    *   *Note* : Supabase gère souvent la table `auth.users` séparément de `public.users`. Si vous utilisez `public.users`, assurez-vous que la policy `INSERT` est : `WITH CHECK (auth.uid() = id)`.

3.  **Invitations & Calendriers partagés** :
    *   Si un utilisateur A invite un utilisateur B, A doit pouvoir insérer une ligne dans `invitations`.
    *   B doit pouvoir lire l'invitation.
    *   **Action** : Vérifier les policies sur la table `invitations`.

## 2. Plan d'action

### Étape 1 : Appliquer les politiques RLS (SQL)
Exécuter le script `dumps/rls_policies.sql` dans Supabase.
*   Cela active la sécurité au niveau de la base de données.
*   Le backend continuera de fonctionner car `get_connection` passe maintenant le contexte utilisateur.

### Étape 2 : Vérifier les Policies manquantes
Le script initial couvrait les bases. Il faut s'assurer que les cas suivants sont couverts :

*   **Table `users`** :
    *   Lecture : `auth.uid() = id` (chacun voit son profil) OU `true` si on veut que les utilisateurs puissent se chercher (pour le partage). *Recommandation : Restreindre au début.*
    *   Modification : `auth.uid() = id`.
*   **Table `invitations`** :
    *   Insert : `EXISTS (SELECT 1 FROM calendars WHERE id = calendar_id AND owner_uid = auth.uid())` (Seul le propriétaire du calendrier peut inviter).
    *   Select : `invited_email = (SELECT email FROM users WHERE id = auth.uid())` (L'invité peut voir son invitation).

### Étape 3 : Tests
1.  **Test Frontend** : Naviguer dans l'application. Vérifier que les calendriers et médicaments s'affichent.
2.  **Test Sécurité** : Essayer d'accéder à une ressource d'un autre utilisateur via l'API (en changeant l'ID dans l'URL par exemple). Le backend doit retourner vide ou une erreur, car la DB ne renverra rien.

## 3. Conclusion
Le code backend est **prêt** grâce à la modification de `get_connection`. La sécurité repose maintenant principalement sur la qualité des règles SQL (Policies) définies dans Supabase.
