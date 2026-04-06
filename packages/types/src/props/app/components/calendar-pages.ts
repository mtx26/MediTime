import type { ApiResult } from '../../../contracts';
import type { UserProfile, CalendarListItem } from '../../../models/common';
import type { MedicineItem } from '../../../models/realtime';

/* ------------------------------------------------------------------ */
/* Base                                                               */
/* ------------------------------------------------------------------ */

export interface CalendarDataSourceProps {
  personalCalendars: Record<string, unknown>;
  sharedUserCalendars: Record<string, unknown>;
  tokenCalendars: Record<string, unknown>;
}

export type CalendarPageSourceType = 'personal' | 'sharedUser' | 'token';

/* ------------------------------------------------------------------ */
/* API Result subtypes                                                */
/* ------------------------------------------------------------------ */

export type CalendarScheduleResult = ApiResult & {
  schedule?: unknown[];
  table?: Record<string, unknown>;
  ifLowStock?: boolean;
  calendarName?: string;
  status?: number;
};

export type NotificationSettingResult = ApiResult & {
  'notifications-enabled'?: boolean;
  status?: number;
};

export type StockMethodResult = ApiResult & {
  method?: string;
  status?: number;
};

export type PillboxUsesResult = ApiResult & {
  status?: number;
  pillbox_uses?: PillboxUseItem[];
};

export type IcsTokensResult = ApiResult & {
  status?: number;
  data?: {
    tokens?: IcsTokenEntry[];
  };
};

/* ------------------------------------------------------------------ */
/* Sources de données calendrier                                      */
/* ------------------------------------------------------------------ */

export interface CalendarScheduleSource {
  fetchSchedule: (calendarId?: string, date?: string) => Promise<CalendarScheduleResult>;
}

export interface CalendarNotificationsSource {
  fetchNotificationsEnabled: (calendarId?: string) => Promise<NotificationSettingResult>;
  updateNotificationsEnabled: (calendarId: string | undefined, enabled: boolean) => Promise<ApiResult>;
}

export interface CalendarStockPersonalCalendars {
  updatePersonalStockDecrementMethod: (calendarId: string | undefined, method: string) => Promise<ApiResult>;
  fetchPersonalStockDecrementMethod: (calendarId: string | undefined) => Promise<StockMethodResult>;
}

export interface CalendarStockAlertsSource {
  fetchPillboxUses: (calendarId: string | undefined) => Promise<ApiResult>;
  restockBox: (calendarId: string | undefined, boxId: string) => Promise<ApiResult>;
}

/* ------------------------------------------------------------------ */
/* Items                                                              */
/* ------------------------------------------------------------------ */

export interface CalendarBoxAlertItem {
  id: string;
  name: string;
  dose?: number | null;
  stock_quantity: number;
  stock_alert_threshold: number;
  box_capacity: number;
  conditions?: Array<{
    max_date?: string | null;
  }>;
  [key: string]: unknown;
}

export interface PillboxUseItem {
  id: string;
  prepared_at: string;
  prepared_by: UserProfile;
}

export interface IcsTokenEntry {
  id: string;
  token: string;
  owner_photo_url: string;
  owner_display_name: string;
  owner_email?: string;
}

/* ------------------------------------------------------------------ */
/* Sources pilulier & ICS                                             */
/* ------------------------------------------------------------------ */

export interface PillboxSource {
  fetchPillboxUses: (calendarId: string) => Promise<PillboxUsesResult>;
  cancelUse: (calendarId: string, useId: string) => Promise<ApiResult>;
}

export interface IcsSource {
  getTokensIcs: (calendarId?: string) => Promise<IcsTokensResult>;
  createTokenIcs: (calendarId?: string) => Promise<ApiResult>;
  deleteTokenIcs: (calendarId: string | undefined, tokenId: string) => Promise<ApiResult>;
}

/* ------------------------------------------------------------------ */
/* Props utilitaires                                                  */
/* ------------------------------------------------------------------ */

export interface CalendarNotFoundProps {
  setNotFound: (value: boolean) => void;
}

/* ------------------------------------------------------------------ */
/* Page Props                                                         */
/* ------------------------------------------------------------------ */

export interface PillboxPageProps extends CalendarDataSourceProps {}
export interface CalendarNotificationsProps extends CalendarDataSourceProps, CalendarNotFoundProps {}
export interface PillboxUsesPageProps extends CalendarDataSourceProps {}
export interface IcsListPageProps extends CalendarDataSourceProps {}
export interface CalendarSettingsPageProps extends CalendarDataSourceProps {}
export interface DailyCalendarPageProps extends CalendarDataSourceProps {}
export interface StockAlertsPageProps extends CalendarDataSourceProps {}
export interface SharedListPageProps extends CalendarDataSourceProps {}
export interface BoxesViewPageProps extends CalendarDataSourceProps {}

export interface CalendarStockProps extends CalendarNotFoundProps {
  personalCalendars: CalendarStockPersonalCalendars;
}

export interface CalendarListPersonalCalendars {
  calendarsData: CalendarListItem[] | null;
  downloadPersonalCalendarPdf: (calendarId: string, includeInactive: boolean) => void;
  renameCalendar: (calendarId: string, newName: string) => Promise<ApiResult>;
  deleteCalendar: (calendarId: string) => Promise<ApiResult>;
}

export interface CalendarListSharedUserCalendars {
  sharedCalendarsData: CalendarListItem[] | null;
  deleteSharedCalendar: (calendarId: string) => Promise<ApiResult>;
}

export interface CalendarListPageProps {
  personalCalendars: CalendarListPersonalCalendars;
  sharedUserCalendars: CalendarListSharedUserCalendars;
}

/* ------------------------------------------------------------------ */
/* CalendarView                                                       */
/* ------------------------------------------------------------------ */

export type CalendarTable = Record<string, unknown[]>;

export type CalendarViewSource = CalendarScheduleSource & {
  fetchStockDecrementMethod: (calendarId?: string) => Promise<StockMethodResult>;
  downloadCalendarPdf: (calendarId?: string) => void;
};

/* ------------------------------------------------------------------ */
/* MedicinesList                                                      */
/* ------------------------------------------------------------------ */

export type GroupedMedicines = Record<string, MedicineItem[]>;

export interface MedicineDisplayItem extends MedicineItem {
  dose?: number | null;
  time_of_day?: string[];
  tablet_count?: number;
  interval_days?: number;
  start_date?: string;
}

/* ------------------------------------------------------------------ */
/* PillboxDisplay                                                     */
/* ------------------------------------------------------------------ */

export interface PillboxTableMed {
  title: string;
  cells: Record<string, number>;
}

export interface PillboxOrderedMed extends PillboxTableMed {
  moment: string;
}

export type PillboxTable = Record<string, PillboxTableMed[]>;

export interface PillboxCalendarSource {
  fetchSchedule: (calendarId: string, date: string) => Promise<CalendarScheduleResult>;
  fetchScheduleNegativeStock: (calendarId: string, medsId: string[]) => Promise<CalendarScheduleResult>;
  fetchIfPillboxUsed: (calendarId: string, date: string) => Promise<ApiResult & { if_pillbox_used?: boolean }>;
  decreaseStock: (calendarId: string, date: string) => Promise<ApiResult>;
  restockBox: (calendarId: string, boxId: string) => Promise<ApiResult>;
}

export interface PillboxContentProps extends CalendarDataSourceProps, CalendarNotFoundProps {
  type: string;
  selectedDate: Date | string | null;
  calendarType: CalendarPageSourceType;
  calendarId: string | undefined;
  basePath: string;
}
