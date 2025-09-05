import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { enabledLanguageCodes, DEFAULT_LANG } from './config/languages.js';

// Import all translation files explicitly
import enTranslation from './locales/en/translation.json';
import frTranslation from './locales/fr/translation.json';
import esTranslation from './locales/es/translation.json';
import deTranslation from './locales/de/translation.json';
import itTranslation from './locales/it/translation.json';
import jaTranslation from './locales/ja/translation.json';
import zhTranslation from './locales/zh/translation.json';
import ptTranslation from './locales/pt/translation.json';
import ruTranslation from './locales/ru/translation.json';

// Create resources object with all available translations
const allTranslations = {
  en: enTranslation,
  fr: frTranslation,
  es: esTranslation,
  de: deTranslation,
  it: itTranslation,
  ja: jaTranslation,
  zh: zhTranslation,
  pt: ptTranslation,
  ru: ruTranslation,
};

// Filter to only include enabled languages
const resources = {};
enabledLanguageCodes.forEach(lang => {
  if (allTranslations[lang]) {
    resources[lang] = { translation: allTranslations[lang] };
  }
});

i18n
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: DEFAULT_LANG,
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
