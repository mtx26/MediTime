// Configuration des langues supportées pour React Native
export const enabledLanguageCodes = ['fr', 'en'];

export const languageNames = {
  fr: 'Français',
  en: 'English',
};

export const getLanguageName = (code) => {
  return languageNames[code] || code.toUpperCase();
};

export const getSystemLanguage = () => {
  // Dans React Native, on peut utiliser expo-localization
  // Pour l'instant, on retourne français par défaut
  return 'fr';
};

export const DEFAULT_LANGUAGE = 'fr';
