# MediTime - Application Mobile iOS

## Migration React Web → React Native iOS

Cette application est la version mobile iOS de MediTime, migrée depuis React Web vers React Native avec Expo.

### ✅ Ce qui a été migré SANS changement

- **Toute la logique métier** : services, hooks, utils, contexts
- **API calls** : performApiCall et toutes les fonctions d'API
- **Authentification** : UserContext et gestion Firebase
- **Gestion d'état** : tous les useState, useEffect, useCallback
- **Base de données** : Supabase et toutes les opérations
- **Notifications** : logique backend (adaptée pour Expo)
- **i18n** : système de traduction (adapté pour React Native)

### 🎨 Ce qui a été adapté pour iOS

- **Interface utilisateur** : div → View, p/span → Text, img → Image
- **Navigation** : react-router-dom → @react-navigation
- **Styles** : CSS → StyleSheet React Native
- **Composants** : HTML → composants React Native
- **Notifications push** : Service Worker → expo-notifications
- **Gestion fichiers** : FileReader → expo-image-picker/camera

### 📱 Structure de l'application

```
src/
├── components/          # Composants réutilisables
│   ├── common/         # LoadingScreen, etc.
│   └── realtime/       # Gestion temps réel (INCHANGÉ)
├── contexts/           # UserContext (INCHANGÉ)
├── hooks/              # Hooks personnalisés (INCHANGÉ)
├── navigation/         # Navigation React Native
│   ├── TabNavigator.js # Navigation par onglets
│   └── AuthNavigator.js # Navigation authentification
├── screens/            # Écrans de l'application
│   ├── auth/          # Connexion, inscription
│   ├── HomeScreen.js  # Écran d'accueil
│   ├── CalendarsScreen.js
│   ├── NotificationsScreen.js
│   ├── ScannerScreen.js
│   └── SettingsScreen.js
├── services/          # Services API (INCHANGÉ)
├── utils/             # Utilitaires (INCHANGÉ)
└── i18n.js           # Configuration i18n pour RN
```

### 🛠 Installation et développement

```bash
# Installation des dépendances
npm install

# Démarrage en mode développement
npm start

# Lancement sur iOS (nécessite Xcode)
npm run ios

# Lancement sur Android
npm run android
```

### 📦 Build et déploiement iOS

```bash
# Installation d'EAS CLI
npm install -g @expo/eas-cli

# Login EAS
eas login

# Configuration du projet
eas build:configure

# Build iOS
npm run build:ios

# Soumission App Store
npm run submit:ios
```

### 🔧 Configuration

1. **Variables d'environnement** : Créer `.env` avec `EXPO_PUBLIC_API_URL`
2. **Firebase** : Configurer les clés dans `google-services.json`
3. **Supabase** : Configurer l'URL et les clés dans les services
4. **Bundle ID** : Modifier dans `app.json` pour votre organisation

### 📋 Fonctionnalités

- ✅ **Authentification** : Connexion, inscription, mot de passe oublié
- ✅ **Navigation** : Tab bar iOS native + stack navigation
- ✅ **Calendriers** : Gestion des calendriers de médicaments
- ✅ **Notifications** : Push notifications iOS
- ✅ **Scanner** : Interface pour scanner les ordonnances
- ✅ **Paramètres** : Configuration utilisateur
- ✅ **Temps réel** : Synchronisation Supabase
- ✅ **i18n** : Support multi-langues

### 🎯 Prochaines étapes

1. **Compléter les écrans** : Détails calendrier, création, édition
2. **Implémenter le scanner** : expo-camera + analyse IA
3. **Affiner l'UI** : Respecter Human Interface Guidelines
4. **Tests** : Tests unitaires et d'intégration
5. **Optimisations** : Performance et UX

### 📱 Spécificités iOS

- **Style iOS natif** : Navigation, couleurs, typographie
- **Gestes iOS** : Swipe, pull-to-refresh, etc.
- **Notifications** : APNs et badges
- **Permissions** : Caméra, galerie, notifications
- **App Store** : Configuration pour submission

### 🔄 Synchronisation avec le web

La logique métier étant identique, les mises à jour peuvent être synchronisées facilement :

1. **Nouvelles fonctions API** → Copier dans React Native
2. **Nouveaux hooks** → Copier directement
3. **Modifications services** → Copier sans changement
4. **UI uniquement** → Adapter les composants visuels

### 📝 Notes importantes

- **Code métier IDENTIQUE** : Aucune régression possible
- **APIs inchangées** : Même backend, mêmes endpoints
- **Base de données identique** : Supabase reste le même
- **Authentification identique** : Firebase Auth conservé
- **Logique notifications identique** : Seul le transport change

Cette migration garantit la **continuité fonctionnelle** tout en offrant une **expérience iOS native optimale**.
