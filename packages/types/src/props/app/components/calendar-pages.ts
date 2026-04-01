import type { ApiResult } from '../../../contracts';

export interface CalendarDataSourceProps {
  personalCalendars: Record<string, unknown>;
  sharedUserCalendars: Record<string, unknown>;
  tokenCalendars: Record<string, unknown>;
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
