// ─── App Shared Props ────────────────────────────────────────────────────────

import type { CalendarInfo } from './models/common';
import type { NotificationItem, SharedTokenItem } from './models/realtime';
import type { ApiResult } from './api/result';
import type {
  PersonalCalendarsApi,
  SharedUserCalendarsApi,
  TokenCalendarsApi,
  NotificationsApi,
  UserApi,
  DocumentsApi,
} from './api/factories';

export interface LoadingStates {
  isInitialLoading: boolean;
  calendars: boolean;
  sharedCalendars: boolean;
  tokens: boolean;
  notifications: boolean;
}

export interface AppPersonalCalendars extends PersonalCalendarsApi, DocumentsApi {
  calendarsData: CalendarInfo[] | null;
  setCalendarsData: (data: CalendarInfo[] | null) => void;
  downloadPersonalCalendarPdf: (calendarId: string, includeInactive: boolean) => void;
}

export interface AppSharedUserCalendars extends SharedUserCalendarsApi {
  sharedCalendarsData: CalendarInfo[] | null;
  setSharedCalendarsData: (data: CalendarInfo[] | null) => void;
}

export interface AppTokenCalendars extends TokenCalendarsApi {
  tokensList: SharedTokenItem[];
  setTokensList: (data: SharedTokenItem[]) => void;
}

export interface AppNotifications extends NotificationsApi {
  notificationsData: NotificationItem[] | null;
  setNotificationsData: (data: NotificationItem[] | null) => void;
}

export interface AppFcm {
  sendTokenToBackend: (maxRetries?: number) => Promise<ApiResult | null>;
}

export interface AppSharedProps {
  loadingStates: LoadingStates;
  personalCalendars: AppPersonalCalendars;
  sharedUserCalendars: AppSharedUserCalendars;
  tokenCalendars: AppTokenCalendars;
  notifications: AppNotifications;
  fcm: AppFcm;
  user: UserApi;
}
