# MediTime - Application Mobile

## Migration React Web vers Expo

Cette application a été migrée de React.js (web) vers Expo pour créer une application mobile native.

## Installation et lancement

1. Installer les dépendances :
```bash
cd MediTime/frontend/meditime
npm install
```

2. Lancer l'application :
```bash
npx expo start
```

3. Scanner le QR code avec l'application Expo Go sur votre téléphone

## Configuration

Avant de lancer l'application, vous devez configurer les variables d'environnement dans `app.json` :

```json
"extra": {
  "apiUrl": "VOTRE_URL_API",
  "supabaseUrl": "VOTRE_URL_SUPABASE",
  "supabaseAnonKey": "VOTRE_CLE_ANON_SUPABASE"
}
```

## Structure du projet

```
src/
├── components/         # Composants réutilisables
├── contexts/          # Contextes React (UserContext)
├── navigation/        # Configuration de navigation
├── screens/           # Écrans de l'application
├── services/          # Services (API, Supabase)
└── utils/            # Utilitaires (logger, etc.)
```

## Fonctionnalités migrées

- ✅ Context utilisateur (UserContext)
- ✅ Navigation par onglets
- ✅ Écrans de base (Accueil, Calendrier, Médicaments, Notifications, Paramètres)
- ✅ Authentification (structure de base)
- ✅ Client Supabase
- ✅ Système de logs

## Prochaines étapes

1. Implémenter l'authentification complète
2. Migrer les composants spécifiques (calendrier, médicaments)
3. Intégrer les notifications push
4. Ajouter le scanner de codes-barres
5. Migrer les services API

## Dépendances principales

- **Expo SDK 53** - Framework de développement
- **React Navigation 6** - Navigation
- **Supabase** - Backend et authentification
- **AsyncStorage** - Stockage local
- **Expo Camera/Barcode Scanner** - Scanner
- **Expo Notifications** - Notifications push

## Commandes utiles

- `npx expo start` - Lancer en mode développement
- `npx expo start --android` - Lancer sur Android
- `npx expo start --ios` - Lancer sur iOS
- `npx expo start --web` - Lancer en mode web
- `npx expo build:android` - Build Android
- `npx expo build:ios` - Build iOS
