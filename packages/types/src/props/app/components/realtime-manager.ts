import type { CalendarInfo } from '../../../models/common';
import type { AppNotification } from './notifications';
import type { LoadingStates } from '../shared-props';

export interface RealtimeManagerProps {
  setCalendarsData: (data: CalendarInfo[] | null) => void;
  setSharedCalendarsData: (data: CalendarInfo[] | null) => void;
  setNotificationsData: (data: AppNotification[] | null) => void;
  setTokensList: (data: unknown[]) => void;
  setLoadingStates: (updater: (prev: LoadingStates) => LoadingStates) => void;
  calendarsData?: CalendarInfo[] | null;
  sharedCalendarsData?: CalendarInfo[] | null;
}
