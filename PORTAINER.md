# Deployer MediTime Backend sur Portainer

Ce guide deploie le backend Flask en conteneur Docker via Portainer.

## 1) Prerequis

- Ton serveur Portainer doit pouvoir cloner le repository Git.
- Le backend ecoute sur le port 5000 dans le conteneur.
- Les variables d'environnement doivent etre definies dans Portainer (dont `GOOGLE_APPLICATION_CREDENTIALS` si Firebase/Vertex est actif).

## 2) Methode recommandee: Portainer Stack (Git repository)

Dans Portainer:

1. Va dans **Stacks**.
2. Clique **Add stack**.
3. Stack name: `meditime-backend`.
4. Build method: **Repository**.
5. Repository URL: URL Git de ton projet.
6. Repository reference: branche a deployer (ex: `main`).
7. Compose path: `MediTime/docker-compose.yml`.
8. Dans **Environment variables**, saisis toutes les variables necessaires (dont `GOOGLE_APPLICATION_CREDENTIALS` en JSON inline).
9. Clique **Deploy the stack**.

## 3) Variables a renseigner dans Portainer

Renseigne au minimum:

- `SUPABASE_DB_HOST`
- `SUPABASE_DB_NAME`
- `SUPABASE_DB_USER`
- `SUPABASE_DB_PASSWORD`
- `SUPABASE_DB_PORT` (souvent `6543` avec Supabase pooler)
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `FRONTEND_URL`

Si tu utilises email/SMS:

- `RESEND_API` (ou `RESEND_API_KEY`)
- `RESEND_FROM_EMAIL` (adresse verifiee dans Resend)
- `RESEND_FROM_NAME` (optionnel, par defaut `MediTime`)
- `TWILIO_API_KEY_SID`
- `TWILIO_API_KEY_SECRET`
- `TWILIO_MESSAGING_SERVICE_SID`

Variables optionnelles utiles:

- `PORT=5000`
- `GOOGLE_CLOUD_LOCATION=us-central1`
- `GUNICORN_WORKERS=4`
- `GUNICORN_THREADS=2`
- `GUNICORN_TIMEOUT=120`
- `NOTIFICATION_EMAIL_ADDRESS` (fallback legacy si `RESEND_FROM_EMAIL` est absent)

Format attendu pour `GOOGLE_APPLICATION_CREDENTIALS`:

- Valeur JSON complete sur une ligne (service account), par exemple avec `\n` dans la cle privee.

## 4) Exposition reseau

- Le stack mappe `5000:5000`.
- Si tu as un reverse proxy (Nginx/Traefik/Caddy), pointe le domaine API vers le serveur Portainer sur le port 5000.

## 5) Verifications apres deploiement

- Dans Portainer, ouvre les logs du conteneur `meditime-backend`.
- Verifie que Gunicorn demarre sans erreur.
- Teste l'endpoint de statut de l'API (route status du backend).

## 5.1) Templates email Supabase

Les emails Supabase Auth utilisent le meme style MediTime que les emails backend Resend.
Pour appliquer les templates via la Supabase Management API:

```powershell
$env:SUPABASE_ACCESS_TOKEN="ton_token_supabase"
$env:PROJECT_REF="ton_project_ref"
python scripts\apply-supabase-email-templates.py
```

Le token se cree depuis `https://supabase.com/dashboard/account/tokens`.
Pour verifier le payload sans modifier Supabase:

```powershell
python scripts\apply-supabase-email-templates.py --dry-run
```

## 6) Important sur le scheduler

Le stack lance aussi `meditime-scheduler` (processus separe), necessaire pour les taches planifiees (stock/cron).

Si tu ne veux pas le scheduler, supprime le service `meditime-scheduler` du fichier compose avant deployment.
