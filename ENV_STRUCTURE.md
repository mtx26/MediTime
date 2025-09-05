# 📁 Structure des fichiers d'environnement (.env) - MediTime

Ce document explique la structure et l'utilisation des différents fichiers d'environnement dans le projet MediTime.

## 🌳 Vue d'ensemble de la structure

```
MediTime/
├── .env                          # Variables globales pour scripts de traduction
├── frontend/
│   └── .env                     # Variables d'environnement frontend (Vite)
├── mobile-app/
│   └── .env                    # Variables d'environnement mobile (React Native)
└── backend/
    └── .env                    # Variables d'environnement backend (Python/Flask)
```

---

## 🌍 1. Fichier `.env` global (MediTime/.env)

**📍 Localisation :** `MediTime/.env`  
**🎯 Usage :** Scripts de traduction automatique  
**🔧 Chargé par :** `scripts/translate.js`

```bash
# Variables d'environnement pour le script de traduction MediTime

# Clé API Google Translate (obligatoire pour le script de traduction)
VITE_GOOGLE_TRANSLATE_API_KEY="your_google_translate_api_key_here"
```

**Variables expliquées :**
- `VITE_GOOGLE_TRANSLATE_API_KEY` : Clé API Google Cloud Translation pour la traduction automatique des fichiers i18n

---

## 🖥️ 2. Frontend Web (.env)

**📍 Localisation :** `MediTime/frontend/.env`  
**🎯 Usage :** Application web frontend (Vite + React)  
**🔧 Chargé par :** Vite (variables préfixées `VITE_`)

### Structure complète :

```bash
# 🌐 URLs et endpoints
VITE_API_URL="your_backend_url_here"
VITE_VITE_URL="your_frontend_url_here"

# 🔥 Configuration Firebase
VITE_FCM_VAPID_KEY="your_fcm_vapid_key_here"
VITE_FIREBASE_API_KEY="your_firebase_api_key_here"
VITE_FIREBASE_APP_ID="your_firebase_app_id_here"
VITE_FIREBASE_AUTH_DOMAIN="your-project.firebaseapp.com"
VITE_FIREBASE_MEASUREMENT_ID="your_measurement_id_here"
VITE_FIREBASE_MESSAGING_SENDER_ID="your_sender_id_here"
VITE_FIREBASE_PROJECT_ID="your-project-id"
VITE_FIREBASE_STORAGE_BUCKET="your-project.firebasestorage.app"

# 🗃️ Supabase (Base de données)
VITE_SUPABASE_ANON_KEY="your_supabase_anon_key_here"
VITE_SUPABASE_URL="https://your-project.supabase.co"

# 🌍 Autres services
VITE_NODE_ENV="production"
```

### Variables expliquées :

#### 🌐 URLs et configuration
- `VITE_API_URL` : URL de l'API backend
- `VITE_VITE_URL` : URL de l'application frontend

#### 🔥 Firebase (Authentification & Push notifications)
- `VITE_FCM_VAPID_KEY` : Clé VAPID pour les notifications push
- `VITE_FIREBASE_API_KEY` : Clé API Firebase
- `VITE_FIREBASE_APP_ID` : ID de l'application Firebase
- `VITE_FIREBASE_AUTH_DOMAIN` : Domaine d'authentification Firebase
- `VITE_FIREBASE_MEASUREMENT_ID` : ID Google Analytics
- `VITE_FIREBASE_MESSAGING_SENDER_ID` : ID pour FCM
- `VITE_FIREBASE_PROJECT_ID` : ID du projet Firebase
- `VITE_FIREBASE_STORAGE_BUCKET` : Bucket de stockage Firebase

#### 🗃️ Supabase (Base de données)
- `VITE_SUPABASE_URL` : URL du projet Supabase
- `VITE_SUPABASE_ANON_KEY` : Clé anonyme Supabase

#### 🌍 Services externes
- `VITE_NODE_ENV` : Environnement d'exécution

---

## 📱 3. Mobile App (.env)

**📍 Localisation :** `MediTime/mobile-app/.env`  
**🎯 Usage :** Application mobile (React Native + Expo)  
**🔧 Chargé par :** react-native-dotenv (configuration dans babel.config.js)

### Structure complète :

```bash
# Environment variables for mobile app

# 🌐 URLs et endpoints
API_URL=https://your-backend-api.com
APP_URL=https://your-frontend-app.com

# 🗃️ Supabase (Base de données)
SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_URL=https://your-project.supabase.co

# 🌍 Autres services
NODE_ENV=production
```

### Variables expliquées :

#### 🌐 URLs et configuration
- `API_URL` : URL de l'API backend
- `APP_URL` : URL de l'application mobile

#### 🗃️ Supabase
- `SUPABASE_URL` : URL du projet Supabase
- `SUPABASE_ANON_KEY` : Clé anonyme Supabase (sans préfixe VITE_)

#### 🌍 Services externes
- `NODE_ENV` : Environnement d'exécution

---

## 🖥️ 4. Backend (Variables d'environnement)

**📍 Localisation :** Variables d'environnement système ou fichier `.env` local  
**🎯 Usage :** API Backend (Flask + Python)  
**🔧 Chargé par :** python-dotenv dans `app/config/config.py`

### Structure attendue :

```bash
# 🔧 Configuration Flask
SECRET_KEY=dev-secret-key
DEBUG=True
ENV=development

# 🗃️ Base de données PostgreSQL (Supabase)
PG_HOST=your-supabase-host.supabase.co
PG_DATABASE=postgres
PG_USER=postgres
PG_PASSWORD=your_database_password_here
PG_PORT=5432

# 🗃️ Supabase
SUPABASE_PROJECT_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_JWT_SECRET=your_jwt_secret_here

# 🔥 Google Console
GOOGLE_APPLICATION_CREDENTIALS=your_service_account_json_content_here
GOOGLE_CLOUD_LOCATION=us-central1

# ☁️ Cloudinary (Stockage d'images)
CLOUDINARY_CLOUD_NAME=your_cloud_name_here
CLOUDINARY_API_KEY=your_api_key_here
CLOUDINARY_API_SECRET=your_api_secret_here

# 📧 Configuration Email (SMTP)
SMTP_HOST=your_smtp_host_here
SMTP_PORT=587
NOTIFICATION_EMAIL_ADDRESS=your_notification_email_here
NOTIFICATION_EMAIL_PASSWORD=your_email_password_here

# 📱 Twilio (SMS) - Optionnel
TWILIO_API_KEY_SID=your_twilio_key_sid_here
TWILIO_API_KEY_SECRET=your_twilio_secret_here
TWILIO_MESSAGING_SERVICE_SID=your_messaging_service_sid_here

# 🌐 Autres
LOG_LEVEL=INFO
SYSTEM_UID=your_system_uid_here
FRONTEND_URL=https://your-frontend-url.com
```

### Variables expliquées :

#### 🔧 Configuration Flask
- `SECRET_KEY` : Clé secrète pour les sessions Flask
- `DEBUG` : Mode debug (True/False)
- `ENV` : Environnement d'exécution

#### 🗃️ Base de données
- `PG_HOST`, `PG_DATABASE`, `PG_USER`, `PG_PASSWORD`, `PG_PORT` : Configuration PostgreSQL via Supabase
- `SUPABASE_PROJECT_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_JWT_SECRET` : Configuration Supabase

#### 🔥 Google Console
- `GOOGLE_APPLICATION_CREDENTIALS` : Contenu JSON des clés de service Google Console
- `GOOGLE_CLOUD_LOCATION` : Région Google Cloud

#### ☁️ Services externes
- `CLOUDINARY_*` : Configuration Cloudinary pour le stockage d'images
- `SMTP_*` : Configuration email
- `TWILIO_*` : Configuration SMS (optionnel)