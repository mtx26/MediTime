import type { ApiResult } from '../../../contracts';
import type { UserProfile, CalendarListItem } from '../../../models/common';
import type { BoxItem, IcsTokenItem, MedicineItem, StockDecrementMethod } from '../../../models/realtime';
import type { WeeklyEventItem, CalendarTable } from '../../../models/schedule';
import type { PersonalCalendarsApi } from '../../../contracts/api/factories';
import type { AppPersonalCalendars, AppSharedUserCalendars, AppTokenCalendars } from '../shared-props';

export type {
  CalendarTable,
  PillboxTable,
  PillboxTableMed,
  PillboxOrderedMed,
} from '../../../models/schedule';

// ─── Base ────────────────────────────────────────────────────────────

/** Props communes à toutes les pages calendrier (personal / shared / token). */
export interface CalendarDataSourceProps {
  personalCalendars: AppPersonalCalendars;
  sharedUserCalendars: AppSharedUserCalendars;
  tokenCalendars: AppTokenCalendars;
}

export type CalendarPageSourceType = 'personal' | 'sharedUser' | 'token';

// ─── API Results ─────────────────────────────────────────────────────

export type CalendarScheduleResult = ApiResult & {
  schedule?: WeeklyEventItem[];
  table?: CalendarTable;
  ifLowStock?: boolean;
  calendarName?: string;
  status?: number;
};

export type NotificationSettingResult = ApiResult & {
  'notifications-enabled'?: boolean;
  status?: number;
};

export type StockMethodResult = ApiResult & {
  method?: StockDecrementMethod;
  status?: number;
};

export type PillboxUsesResult = ApiResult & {
  status?: number;
  pillbox_uses?: PillboxUseItem[];
};

export type IcsTokensResult = ApiResult & {
  status?: number;
  data?: { tokens?: IcsTokenEntry[] };
};

// ─── Data Items ──────────────────────────────────────────────────────

export type CalendarBoxAlertItem = Pick<
  BoxItem,
  'id' | 'name' | 'dose' | 'stock_quantity' | 'stock_alert_threshold' | 'box_capacity' | 'conditions'
>;

export interface PillboxUseItem {
  id: string;
  prepared_at: string;
  prepared_by: UserProfile;
}

export type IcsTokenEntry = Required<Pick<
  IcsTokenItem,
  'id' | 'token' | 'owner_photo_url' | 'owner_display_name'
>> & Pick<IcsTokenItem, 'owner_email'>;

export type MedicineDisplayItem = MedicineItem;

export type GroupedMedicines = Record<string, MedicineItem[]>;

// ─── Data Sources (méthodes d'accès API par type de calendrier) ─────

export interface CalendarScheduleSource {
  fetchSchedule: (calendarId?: string, date?: string) => Promise<CalendarScheduleResult>;
}

export interface CalendarNotificationsSource {
  fetchNotificationsEnabled: (calendarId?: string) => Promise<NotificationSettingResult>;
  updateNotificationsEnabled: (calendarId: string | undefined, enabled: boolean) => Promise<ApiResult>;
}

export type CalendarStockPersonalCalendars = Pick<PersonalCalendarsApi, 'updatePersonalStockDecrementMethod' | 'fetchPersonalStockDecrementMethod'>;

export interface CalendarStockAlertsSource {
  fetchPillboxUses: (calendarId: string | undefined) => Promise<ApiResult>;
  restockBox: (calendarId: string | undefined, boxId: string) => Promise<ApiResult>;
}

export interface PillboxSource {
  fetchPillboxUses: (calendarId: string) => Promise<PillboxUsesResult>;
  cancelUse: (calendarId: string, useId: string) => Promise<ApiResult>;
}

export interface IcsSource {
  getTokensIcs: (calendarId?: string) => Promise<IcsTokensResult>;
  createTokenIcs: (calendarId?: string) => Promise<ApiResult>;
  deleteTokenIcs: (calendarId: string | undefined, tokenId: string) => Promise<ApiResult>;
}

export type CalendarViewSource = CalendarScheduleSource & {
  fetchStockDecrementMethod: (calendarId?: string) => Promise<StockMethodResult>;
  downloadCalendarPdf: (calendarId?: string) => void;
};

export interface PillboxCalendarSource {
  fetchSchedule: (calendarId: string, date: string) => Promise<CalendarScheduleResult>;
  fetchScheduleNegativeStock: (calendarId: string, medsId: string[]) => Promise<CalendarScheduleResult>;
  fetchIfPillboxUsed: (calendarId: string, date: string) => Promise<ApiResult & { if_pillbox_used?: boolean }>;
  decreaseStock: (calendarId: string, date: string) => Promise<ApiResult>;
  restockBox: (calendarId: string, boxId: string) => Promise<ApiResult>;
}

// ─── Utility Props ───────────────────────────────────────────────────

export interface CalendarNotFoundProps {
  setNotFound: (value: boolean) => void;
}

// ─── Page Props ──────────────────────────────────────────────────────

export type PillboxPageProps = CalendarDataSourceProps;
export type PillboxUsesPageProps = CalendarDataSourceProps;
export type IcsListPageProps = CalendarDataSourceProps;
export type CalendarSettingsPageProps = CalendarDataSourceProps;
export type DailyCalendarPageProps = CalendarDataSourceProps;
export type StockAlertsPageProps = CalendarDataSourceProps;
export type SharedListPageProps = CalendarDataSourceProps;
export type BoxesViewPageProps = CalendarDataSourceProps;

export interface CalendarNotificationsProps extends CalendarDataSourceProps, CalendarNotFoundProps {}

export interface CalendarStockProps extends CalendarNotFoundProps {
  personalCalendars: CalendarStockPersonalCalendars;
}

export type PillboxDisplayType = 'pillbox' | 'calendar';

export interface PillboxContentProps extends CalendarDataSourceProps, CalendarNotFoundProps {
  type: PillboxDisplayType;
  selectedDate: Date | string | null;
  calendarType: CalendarPageSourceType;
  calendarId: string | undefined;
  basePath: string;
}

// ─── Calendar List Props ─────────────────────────────────────────────

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
