import { LANGUAGES, DEFAULT_LANG } from '@meditime/constants';
import type { Language } from '@meditime/constants';

export { LANGUAGES, DEFAULT_LANG };

export const getLocale = (code: string): string => {
  return LANGUAGES.find((lang) => lang.code === code)?.locale || code;
};

export const getLabel = (code: string): string => {
  return LANGUAGES.find((lang) => lang.code === code)?.label || code;
};

export const enabledLanguageCodes: string[] = LANGUAGES.map(lang => lang.code);

export const getDateLocale = (langCode: string): Language['dateLocale'] => {
  const fallback = LANGUAGES.find((lang) => lang.code === DEFAULT_LANG) ?? LANGUAGES[0];
  return LANGUAGES.find((lang) => lang.code === langCode)?.dateLocale || fallback.dateLocale;
};
