# Script de traduction MediTime

Ce script permet de traduire automatiquement les fichiers de traduction pour le frontend et l'application mobile de MediTime.

## Utilisation

### Pour le frontend (par défaut)
```bash
node scripts/translate.js
```

### Pour l'application mobile
```bash
node scripts/translate.js --project=mobile
```

## Options disponibles

- `--project=frontend` : Traduit les fichiers du frontend (par défaut)
- `--project=mobile` ou `--project=mobile-app` : Traduit les fichiers de l'application mobile
- `--check-only` : Vérifie les clés manquantes sans traduire
- `--local-only` : Met à jour seulement les locales sans traduire
- `--fill-missing` : Remplit seulement les clés manquantes
- `--force` : Force la traduction même si les fichiers existent

## Exemples

```bash
# Vérifier les clés manquantes pour le frontend
node scripts/translate.js --check-only

# Vérifier les clés manquantes pour l'app mobile
node scripts/translate.js --project=mobile --check-only

# Remplir les clés manquantes pour le frontend
node scripts/translate.js --fill-missing

# Remplir les clés manquantes pour l'app mobile
node scripts/translate.js --project=mobile --fill-missing

# Forcer la traduction complète pour l'app mobile
node scripts/translate.js --project=mobile --force
```

## Exemples PowerShell (Windows)

```powershell
# Naviguer vers MediTime et vérifier les clés manquantes pour l'app mobile
cd MediTime; node scripts/translate.js --project=mobile --check-only

# Naviguer vers MediTime et remplir les clés manquantes pour l'app mobile
cd MediTime; node scripts/translate.js --project=mobile --fill-missing

# Naviguer vers MediTime et forcer la traduction pour l'app mobile
cd MediTime; node scripts/translate.js --project=mobile --force
```

## Configuration

Le script nécessite une clé API Google Translate définie dans la variable d'environnement `VITE_GOOGLE_TRANSLATE_API_KEY` dans le fichier `.env` du répertoire MediTime.

### Variables d'environnement requises

Créez un fichier `.env` dans le répertoire `MediTime/` avec le contenu suivant :

```bash
# Clé API Google Translate (obligatoire)
VITE_GOOGLE_TRANSLATE_API_KEY=votre_cle_api_google_translate_ici

# Exemple de clé (remplacez par votre vraie clé)
# VITE_GOOGLE_TRANSLATE_API_KEY=AIzaSyBxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### Comment obtenir une clé API Google Translate

1. Allez sur [Google Cloud Console](https://console.cloud.google.com/)
2. Créez un nouveau projet ou sélectionnez un projet existant
3. Activez l'API Google Translate dans la bibliothèque d'APIs
4. Créez des identifiants (clé API)
5. Copiez la clé et ajoutez-la dans votre fichier `.env`

⚠️ **Important** : N'oubliez pas d'ajouter `.env` à votre fichier `.gitignore` pour ne pas exposer vos clés API.

### Configuration rapide

```powershell
# 1. Naviguez vers le répertoire MediTime
cd MediTime

# 2. Copiez le fichier d'exemple
cp .env.example .env

# 3. Éditez le fichier .env et ajoutez votre clé API Google Translate
# VITE_GOOGLE_TRANSLATE_API_KEY=votre_cle_api_ici
```

## Structure des fichiers

### Frontend
- Configuration : `frontend/src/config/languages.js`
- Fichier source : `frontend/src/locales/fr/translation.json`
- Fichiers traduits : `frontend/src/locales/{langue}/translation.json`

### Application mobile
- Configuration : `mobile-app/src/config/languages.js`
- Fichier source : `mobile-app/src/locales/fr/translation.json`
- Fichiers traduits : `mobile-app/src/locales/{langue}/translation.json`
