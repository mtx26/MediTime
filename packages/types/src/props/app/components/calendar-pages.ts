import type { ApiResult } from '../../../contracts';

export interface CalendarDataSourceProps {
  personalCalendars: Record<string, unknown>;
  sharedUserCalendars: Record<string, unknown>;
  tokenCalendars: Record<string, unknown>;
}

export type CalendarPageSourceType = 'personal' | 'sharedUser' | 'token';

export type CalendarScheduleResult = ApiResult & {
  schedule?: unknown[];
  table?: Record<string, unknown>;
  ifLowStock?: boolean;
  status?: number;
};

export interface CalendarScheduleSource {
  fetchSchedule: (calendarId?: string, date?: string) => Promise<CalendarScheduleResult>;
}

export type CalendarNotificationsEnabledResult = ApiResult & {
  'notifications-enabled'?: boolean;
  status?: number;
};

export interface CalendarNotificationsSource {
  fetchNotificationsEnabled: (calendarId?: string) => Promise<CalendarNotificationsEnabledResult>;
  updateNotificationsEnabled: (calendarId: string | undefined, enabled: boolean) => Promise<ApiResult>;
}

export type CalendarStockMethodResult = ApiResult & {
  method?: string;
  status?: number;
};

export interface CalendarStockPersonalCalendars {
  updatePersonalStockDecrementMethod: (calendarId: string | undefined, method: string) => Promise<ApiResult>;
  fetchPersonalStockDecrementMethod: (calendarId: string | undefined) => Promise<CalendarStockMethodResult>;
}

export interface CalendarStockAlertsSource {
  fetchPillboxUses: (calendarId: string | undefined) => Promise<ApiResult>;
  restockBox: (calendarId: string | undefined, boxId: string | number) => Promise<ApiResult>;
}

export interface CalendarBoxAlertItem {
  id: string | number;
  name: string;
  dose?: string | number | null;
  stock_quantity: number;
  stock_alert_threshold: number;
  box_capacity: number;
  conditions?: Array<{
    max_date?: string | null;
  }>;
  [key: string]: unknown;
}

export interface CalendarNotFoundProps {
  setNotFound: (value: boolean) => void;
}

export interface PillboxPageProps extends CalendarDataSourceProps {}

export type NotificationSettingResult = ApiResult & {
  status?: number;
  'notifications-enabled'?: boolean;
};

export type StockMethodResult = ApiResult & {
  status?: number;
  method?: string;
};

export interface CalendarNotificationsSource {
  fetchNotificationsEnabled: (calendarId?: string) => Promise<NotificationSettingResult>;
  updateNotificationsEnabled: (calendarId: string | undefined, enabled: boolean) => Promise<ApiResult>;
}

export interface CalendarStockPersonalCalendars {
  updatePersonalStockDecrementMethod: (calendarId: string | undefined, method: string) => Promise<ApiResult>;
  fetchPersonalStockDecrementMethod: (calendarId: string | undefined) => Promise<StockMethodResult>;
}

export interface CalendarNotificationsProps extends CalendarDataSourceProps, CalendarNotFoundProps {}

export interface CalendarStockProps extends CalendarNotFoundProps {
  personalCalendars: CalendarStockPersonalCalendars;
}

export interface PillboxPreparedBy {
  photo_url: string;
  display_name: string;
  email?: string;
}

export interface PillboxUseItem {
  id: string | number;
  prepared_at: string;
  prepared_by: PillboxPreparedBy;
}

export type PillboxUsesResult = ApiResult & {
  status?: number;
  pillbox_uses?: PillboxUseItem[];
};

export interface PillboxSource {
  fetchPillboxUses: (calendarId: string) => Promise<PillboxUsesResult>;
  cancelUse: (calendarId: string, useId: string | number) => Promise<ApiResult>;
}

export interface PillboxUsesPageProps extends CalendarDataSourceProps {}

export interface IcsTokenEntry {
  id: string | number;
  token: string;
  owner_photo_url: string;
  owner_display_name: string;
  owner_email?: string;
}

export type IcsTokensResult = ApiResult & {
  status?: number;
  data?: {
    tokens?: IcsTokenEntry[];
  };
};

export interface IcsSource {
  getTokensIcs: (calendarId?: string) => Promise<IcsTokensResult>;
  createTokenIcs: (calendarId?: string) => Promise<ApiResult>;
  deleteTokenIcs: (calendarId: string | undefined, tokenId: string | number) => Promise<ApiResult>;
}

export interface IcsListPageProps extends CalendarDataSourceProps {}

export interface CalendarSettingsPageProps extends CalendarDataSourceProps {}

export interface DailyCalendarPageProps extends CalendarDataSourceProps {}

export interface StockAlertsPageProps extends CalendarDataSourceProps {}
