import { fr, enUS, es, de, it, ja, zhCN, ptBR, ru } from 'date-fns/locale';
import * as Flags from 'country-flag-icons/react/3x2';

export const LANGUAGES = [
  { flag: 'FR', code: 'fr', locale: 'fr-FR', label: 'Français', dateLocale: fr, FlagComponent: Flags.FR },
  { flag: 'US', code: 'en', locale: 'en-US', label: 'English', dateLocale: enUS, FlagComponent: Flags.US },
  { flag: 'ES', code: 'es', locale: 'es-ES', label: 'Español', dateLocale: es, FlagComponent: Flags.ES },
  { flag: 'DE', code: 'de', locale: 'de-DE', label: 'Deutsch', dateLocale: de, FlagComponent: Flags.DE },
  { flag: 'IT', code: 'it', locale: 'it-IT', label: 'Italiano', dateLocale: it, FlagComponent: Flags.IT },
  { flag: 'JP', code: 'ja', locale: 'ja-JP', label: '日本語', dateLocale: ja, FlagComponent: Flags.JP },
  { flag: 'CN', code: 'zh', locale: 'zh-CN', label: '中文', dateLocale: zhCN, FlagComponent: Flags.CN },
  { flag: 'PT', code: 'pt', locale: 'pt-BR', label: 'Português', dateLocale: ptBR, FlagComponent: Flags.PT },
  { flag: 'RU', code: 'ru', locale: 'ru-RU', label: 'Русский', dateLocale: ru, FlagComponent: Flags.RU }
];

export const DEFAULT_LANG = 'en';

export const getLocale = (code) => {
  return LANGUAGES.find((lang) => lang.code === code)?.locale || code;
};

export const getLabel = (code) => {
  return LANGUAGES.find((lang) => lang.code === code)?.label || code;
};

export const enabledLanguageCodes = LANGUAGES.map(lang => lang.code);

export const getDateLocale = (langCode) => {
  return LANGUAGES.find((lang) => lang.code === langCode)?.dateLocale || enUS;
};
