import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { enabledLanguageCodes, DEFAULT_LANG } from '@meditime/config';
import { translationResources } from '@meditime/i18n';

const resources = {};

for (const lang of enabledLanguageCodes) {
  if (translationResources[lang]) {
    resources[lang] = translationResources[lang];
  }
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: DEFAULT_LANG,
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
