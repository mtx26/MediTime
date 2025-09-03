import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLocales } from 'expo-localization';

// Configuration simplifiée pour React Native
const DEFAULT_LANG = 'fr';
const enabledLanguageCodes = ['fr', 'en'];

// Resources de traduction basiques pour démarrer
const resources = {
  fr: {
    translation: {
      "home_meta": {
        "title": "MediTime - Gestion de médicaments",
        "description": "Gérez vos médicaments facilement avec MediTime"
      },
      "fcm": {
        "sw_registered": "Service Worker enregistré",
        "sw_error": "Erreur Service Worker",
        "token_registered": "Token FCM enregistré",
        "token_send_error": "Erreur envoi token FCM"
      },
      "common": {
        "loading": "Chargement...",
        "error": "Erreur",
        "success": "Succès",
        "cancel": "Annuler",
        "confirm": "Confirmer",
        "save": "Sauvegarder",
        "delete": "Supprimer",
        "edit": "Modifier",
        "add": "Ajouter",
        "back": "Retour",
        "next": "Suivant",
        "close": "Fermer"
      },
      "auth": {
        "login": "Connexion",
        "register": "Inscription",
        "logout": "Déconnexion",
        "email": "Email",
        "password": "Mot de passe",
        "forgot_password": "Mot de passe oublié",
        "sign_in": "Se connecter",
        "sign_up": "S'inscrire",
        "or": "ou",
        "already_have_account": "Vous avez déjà un compte ?",
        "no_account": "Pas encore de compte ?",
        "reset_password": "Réinitialiser le mot de passe"
      },
      "navigation": {
        "home": "Accueil",
        "calendars": "Calendriers",
        "scanner": "Scanner",
        "notifications": "Notifications",
        "settings": "Paramètres"
      },
      "calendar": {
        "my_calendars": "Mes calendriers",
        "shared_calendars": "Calendriers partagés",
        "add_calendar": "Ajouter un calendrier",
        "calendar_name": "Nom du calendrier",
        "create": "Créer",
        "today": "Aujourd'hui",
        "week": "Semaine",
        "month": "Mois"
      },
      "medicines": {
        "medicines": "Médicaments",
        "add_medicine": "Ajouter un médicament",
        "medicine_name": "Nom du médicament",
        "dosage": "Dosage",
        "frequency": "Fréquence",
        "stock": "Stock",
        "low_stock": "Stock faible"
      },
      "settings": {
        "account": "Compte",
        "preferences": "Préférences",
        "notifications": "Notifications",
        "security": "Sécurité",
        "about": "À propos",
        "version": "Version",
        "language": "Langue"
      }
    }
  },
  en: {
    translation: {
      "home_meta": {
        "title": "MediTime - Medication Management",
        "description": "Manage your medications easily with MediTime"
      },
      "fcm": {
        "sw_registered": "Service Worker registered",
        "sw_error": "Service Worker error",
        "token_registered": "FCM Token registered",
        "token_send_error": "FCM Token send error"
      },
      "common": {
        "loading": "Loading...",
        "error": "Error",
        "success": "Success",
        "cancel": "Cancel",
        "confirm": "Confirm",
        "save": "Save",
        "delete": "Delete",
        "edit": "Edit",
        "add": "Add",
        "back": "Back",
        "next": "Next",
        "close": "Close"
      },
      "auth": {
        "login": "Login",
        "register": "Register",
        "logout": "Logout",
        "email": "Email",
        "password": "Password",
        "forgot_password": "Forgot password",
        "sign_in": "Sign in",
        "sign_up": "Sign up",
        "or": "or",
        "already_have_account": "Already have an account?",
        "no_account": "Don't have an account yet?",
        "reset_password": "Reset password"
      },
      "navigation": {
        "home": "Home",
        "calendars": "Calendars",
        "scanner": "Scanner",
        "notifications": "Notifications",
        "settings": "Settings"
      },
      "calendar": {
        "my_calendars": "My calendars",
        "shared_calendars": "Shared calendars",
        "add_calendar": "Add calendar",
        "calendar_name": "Calendar name",
        "create": "Create",
        "today": "Today",
        "week": "Week",
        "month": "Month"
      },
      "medicines": {
        "medicines": "Medicines",
        "add_medicine": "Add medicine",
        "medicine_name": "Medicine name",
        "dosage": "Dosage",
        "frequency": "Frequency",
        "stock": "Stock",
        "low_stock": "Low stock"
      },
      "settings": {
        "account": "Account",
        "preferences": "Preferences",
        "notifications": "Notifications",
        "security": "Security",
        "about": "About",
        "version": "Version",
        "language": "Language"
      }
    }
  }
};

// Fonction pour sauvegarder la langue
const saveLanguage = async (language) => {
  try {
    await AsyncStorage.setItem('user-language', language);
  } catch (error) {
    console.error('Error saving language:', error);
  }
};

// Fonction pour charger la langue
const loadLanguage = async () => {
  try {
    const savedLanguage = await AsyncStorage.getItem('user-language');
    return savedLanguage || getDeviceLanguage();
  } catch (error) {
    console.error('Error loading language:', error);
    return getDeviceLanguage();
  }
};

// Fonction pour détecter la langue de l'appareil
const getDeviceLanguage = () => {
  const locales = getLocales();
  const deviceLang = locales[0]?.languageCode || DEFAULT_LANG;
  return enabledLanguageCodes.includes(deviceLang) ? deviceLang : DEFAULT_LANG;
};

// Configuration i18next
const initI18n = async () => {
  const language = await loadLanguage();

  i18n
    .use(initReactI18next)
    .init({
      debug: __DEV__,
      lng: language,
      fallbackLng: DEFAULT_LANG,
      resources,
      interpolation: {
        escapeValue: false,
      },
      react: {
        useSuspense: false,
      },
    });

  // Sauvegarder le changement de langue
  i18n.on('languageChanged', (lng) => {
    saveLanguage(lng);
  });
};

initI18n();

export default i18n;
