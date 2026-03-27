import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { enabledLanguageCodes, DEFAULT_LANG } from '@meditime/config';
import { translationResources } from '@meditime/i18n';

type TranslationResources = typeof translationResources;
type TranslationLang = keyof TranslationResources;

const resources: Record<string, TranslationResources[TranslationLang]> = {};

for (const lang of enabledLanguageCodes) {
  if (lang in translationResources) {
    const key = lang as TranslationLang;
    resources[key] = translationResources[key];
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
