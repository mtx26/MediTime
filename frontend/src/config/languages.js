export const LANGUAGES = [
  { flag: 'FR', code: 'fr', locale: 'fr_FR', label: 'Français' },
  { flag: 'US', code: 'en', locale: 'en_US', label: 'English' },
  { flag: 'ES', code: 'es', locale: 'es_ES', label: 'Español' },
  { flag: 'DE', code: 'de', locale: 'de_DE', label: 'Deutsch' },
  { flag: 'IT', code: 'it', locale: 'it_IT', label: 'Italiano' },
  { flag: 'JP', code: 'ja', locale: 'ja_JP', label: '日本語' },
  { flag: 'CN', code: 'zh', locale: 'zh_CN', label: '中文' },
  { flag: 'PT', code: 'pt', locale: 'pt_BR', label: 'Português' },
  { flag: 'RU', code: 'ru', locale: 'ru_RU', label: 'Русский' }
];

export const DEFAULT_LANG = 'en_US';

export const getLocale = (code) => {
  return LANGUAGES.find((lang) => lang.code === code)?.locale || code.replace('-', '_');
};

export const getLabel = (code) => {
  return LANGUAGES.find((lang) => lang.code === code)?.label || code;
};

export const enabledLanguageCodes = LANGUAGES.map(lang => lang.code);
