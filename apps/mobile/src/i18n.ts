import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as SecureStore from 'expo-secure-store';
import { enabledLanguageCodes } from '@meditime/config';
import { DEFAULT_LANG } from '@meditime/constants';
import { translationResources } from '@meditime/i18n';

type TranslationResources = typeof translationResources;
type TranslationLang = keyof TranslationResources;

const resources: Record<string, TranslationResources[TranslationLang]> = {};
export const MOBILE_LANGUAGE_STORAGE_KEY = 'meditime.mobile.language';

for (const lang of enabledLanguageCodes) {
  if (lang in translationResources) {
    const key = lang as TranslationLang;
    resources[key] = translationResources[key];
  }
}

void (async () => {
  const storedLanguage = await SecureStore.getItemAsync(MOBILE_LANGUAGE_STORAGE_KEY);
  const initialLanguage = storedLanguage && enabledLanguageCodes.includes(storedLanguage)
    ? storedLanguage
    : DEFAULT_LANG;

  await i18n
    .use(initReactI18next)
    .init({
    resources,
    lng: initialLanguage,
    fallbackLng: DEFAULT_LANG,
    interpolation: {
      escapeValue: false,
    },
  });
})();

export default i18n;
