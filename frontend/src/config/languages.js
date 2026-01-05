import { fr, enUS, enGB, es, de, it, ja, zhCN, ptBR, ru, nl } from 'date-fns/locale';
import * as Flags from 'country-flag-icons/react/3x2';

export const LANGUAGES = [
  { flag: 'DE', code: 'de', locale: 'de-BE', label: 'Deutsch (Belgien)', dateLocale: de, FlagComponent: Flags.BE },
  { flag: 'DE', code: 'de', locale: 'de-DE', label: 'Deutsch', dateLocale: de, FlagComponent: Flags.DE },
  { flag: 'GB', code: 'en', locale: 'en-GB', label: 'English (UK)', dateLocale: enGB, FlagComponent: Flags.GB },
  { flag: 'US', code: 'en', locale: 'en-US', label: 'English', dateLocale: enUS, FlagComponent: Flags.US },
  { flag: 'ES', code: 'es', locale: 'es-ES', label: 'Español', dateLocale: es, FlagComponent: Flags.ES },
  { flag: 'BE', code: 'fr', locale: 'fr-BE', label: 'Français (Belgique)', dateLocale: fr, FlagComponent: Flags.BE },
  { flag: 'FR', code: 'fr', locale: 'fr-FR', label: 'Français', dateLocale: fr, FlagComponent: Flags.FR },
  { flag: 'IT', code: 'it', locale: 'it-IT', label: 'Italiano', dateLocale: it, FlagComponent: Flags.IT },
  { flag: 'JP', code: 'ja', locale: 'ja-JP', label: '日本語', dateLocale: ja, FlagComponent: Flags.JP },
  { flag: 'BE', code: 'nl', locale: 'nl-BE', label: 'Nederlands (België)', dateLocale: nl, FlagComponent: Flags.BE },
  { flag: 'NL', code: 'nl', locale: 'nl-NL', label: 'Nederlands', dateLocale: nl, FlagComponent: Flags.NL },
  { flag: 'PT', code: 'pt', locale: 'pt-BR', label: 'Português', dateLocale: ptBR, FlagComponent: Flags.PT },
  { flag: 'RU', code: 'ru', locale: 'ru-RU', label: 'Русский', dateLocale: ru, FlagComponent: Flags.RU },
  { flag: 'CN', code: 'zh', locale: 'zh-CN', label: '中文', dateLocale: zhCN, FlagComponent: Flags.CN }
];

export const DEFAULT_LANG = 'en-US';

// Récupère la locale à partir du code court (fr -> fr-FR)
export const getLocale = (code) => {
  return LANGUAGES.find((lang) => lang.locale === code)?.locale || code;
};

// Utilise les locales complètes (fr-FR, en-US, etc.) pour les URLs
export const enabledLanguageCodes = LANGUAGES.map(lang => lang.locale);

export const getDateLocale = (langCode) => {
  return LANGUAGES.find((lang) => lang.locale === langCode)?.dateLocale || enUS;
};

// Trouve une langue par locale ou code
export const findLanguage = (identifier) => {
  return LANGUAGES.find((lang) => lang.locale === identifier);
};
