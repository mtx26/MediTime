import { fr, enUS, es, de, it, ja, zhCN, ptBR, ru } from 'date-fns/locale';
import type { Locale as DateLocale } from 'date-fns';
import type { Language, MedicineReviewConditionInput } from '@meditime/types';
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

export const DEFAULT_CONDITION: MedicineReviewConditionInput = {
  time_of_day: undefined,
  interval_days: '',
  start_date: '',
  tablet_count: '',
  max_date_mode: undefined,
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

export const LANGUAGES: Language<DateLocale, typeof Flags.FR>[] = [
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

// ============================================================================
// Calendar Import Constants
// ============================================================================

export const ADD_CALENDAR_IMPORT_TYPES = {
  MANUAL: 'manual',
  QR: 'qr',
  FILE: 'file',
} as const;

export type AddCalendarImportType =
  (typeof ADD_CALENDAR_IMPORT_TYPES)[keyof typeof ADD_CALENDAR_IMPORT_TYPES];

export const QR_PARTIAL_IMPORT_REDIRECT_DELAY_MS = 3000;
export const DATAMATRIX_PREVIEW_MAX_HEIGHT_PX = 160;

// ============================================================================
// Image Validation Constants
// ============================================================================

export const ALLOWED_IMAGE_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'] as const;
export const ALLOWED_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif'] as const;

// ============================================================================
// Medicine Review Constants
// ============================================================================

export const MEDICINE_REVIEW_CONDITION_FIELDS = [
  'time_of_day',
  'interval_days',
  'tablet_count',
  'start_date',
  'max_date_mode',
  'max_date',
  'max_date_days',
] as const;

export const MEDICINE_REVIEW_MAIN_FIELDS = [
  'name',
  'dose',
  'stock_quantity',
  'stock_max',
  'stock_alert_threshold',
] as const;

export const MEDICINE_REVIEW_TIME_OF_DAY_HOURS = {
  morning: 8,
  noon: 12,
  evening: 18,
} as const;

// ============================================================================
// Calendar Route Constants
// ============================================================================

export const CALENDAR_ROUTE_PREFIXES = {
  SHARED_USER: '/shared-user-calendar',
  SHARED_TOKEN: '/shared-token-calendar',
} as const;

export const CALENDAR_SETTINGS_TABS = {
  STOCK: 'stock',
  NOTIFICATIONS: 'notifications',
} as const;

// ============================================================================
// Stock Decrement Methods
// ============================================================================

export const STOCK_DECREMENT_METHODS = {
  WEEKLY_PILLBOX: 'weekly_pillbox',
  DAILY_MIDNIGHT: 'daily_midnight',
} as const;

// ============================================================================
// Time of Day Constants
// ============================================================================

export const ALL_TIMES = ['morning', 'noon', 'evening'] as const;

export const TIME_OF_DAY_COLORS: Record<string, string> = {
  morning: 'bg-red-400/20 text-red-700 border-red-400/50',
  noon: 'bg-emerald-400/20 text-emerald-700 border-emerald-400/50',
  evening: 'bg-blue-400/20 text-blue-700 border-blue-400/50',
};
