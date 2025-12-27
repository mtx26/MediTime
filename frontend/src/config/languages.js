import { fr, enUS, es, de, it, ja, zhCN, ptBR, ru } from 'date-fns/locale';

export const LANGUAGES = [
  { flag: 'FR', code: 'fr', locale: 'fr-FR', label: 'Français', dateLocale: fr },
  { flag: 'US', code: 'en', locale: 'en-US', label: 'English', dateLocale: enUS },
  { flag: 'ES', code: 'es', locale: 'es-ES', label: 'Español', dateLocale: es },
  { flag: 'DE', code: 'de', locale: 'de-DE', label: 'Deutsch', dateLocale: de },
  { flag: 'IT', code: 'it', locale: 'it-IT', label: 'Italiano', dateLocale: it },
  { flag: 'JP', code: 'ja', locale: 'ja-JP', label: '日本語', dateLocale: ja },
  { flag: 'CN', code: 'zh', locale: 'zh-CN', label: '中文', dateLocale: zhCN },
  { flag: 'PT', code: 'pt', locale: 'pt-BR', label: 'Português', dateLocale: ptBR },
  { flag: 'RU', code: 'ru', locale: 'ru-RU', label: 'Русский', dateLocale: ru }
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
