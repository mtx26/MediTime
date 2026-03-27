import { fr, enUS, es, de, it, ja, zhCN, ptBR, ru } from 'date-fns/locale';
import type { Locale as DateLocale } from 'date-fns';
import * as Flags from 'country-flag-icons/react/3x2';

// ============================================================================
//  Pillbox Display Constants
// ============================================================================

export const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const PILL_COUNT = {
  0.25: '0.25',
  0.5: '0.50',
  0.75: '0.75',
  1: '1.00',
};

// ============================================================================
// 💊 Medicine Defaults
// ============================================================================

export const DEFAULT_CONDITION = {
  time_of_day: '',
  interval_days: '',
  start_date: '',
  tablet_count: '',
  max_date_mode: '',
  max_date: null,
  max_date_days: null,
};

// ============================================================================
// Theme Constants
// ============================================================================

export const DEFAULT_THEME = 'light';

// ============================================================================
// Language Constants
// ============================================================================

export interface Language {
  flag: string;
  code: string;
  locale: string;
  label: string;
  dateLocale: DateLocale;
  FlagComponent: typeof Flags.FR;
}

export const LANGUAGES: Language[] = [
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

export const DEFAULT_LANG: string = 'en';
