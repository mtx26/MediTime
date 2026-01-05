import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { enabledLanguageCodes, DEFAULT_LANG, LANGUAGES } from './config/languages.js';

const translationFiles = import.meta.glob('./locales/*/translation.json', { eager: true });

const resources = {};

for (const path in translationFiles) {
  const match = path.match(/\.\/locales\/(.*?)\/translation\.json$/);
  if (match) {
    const lang = match[1];
    if (enabledLanguageCodes.includes(lang)) {
      resources[lang] = { translation: translationFiles[path].default };
    }
  }
}

// Convertit un code court (fr) ou locale (fr-FR) vers la locale supportée
const normalizeLanguage = (lng) => {
  if (!lng) return DEFAULT_LANG;
  // Si c'est déjà une locale supportée
  if (enabledLanguageCodes.includes(lng)) return lng;
  // Cherche une locale qui correspond au code court
  const found = LANGUAGES.find(l => l.code === lng || l.locale.startsWith(lng));
  return found?.locale || DEFAULT_LANG;
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: DEFAULT_LANG,
    supportedLngs: enabledLanguageCodes,
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      convertDetectedLanguage: normalizeLanguage,
    },
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
