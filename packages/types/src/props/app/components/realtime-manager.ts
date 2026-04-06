import type { CalendarInfo } from '../../../models/common';
import type { NotificationItem, SharedTokenItem } from '../../../models/realtime';
import type { LoadingStates } from '../shared-props';

export interface RealtimeManagerProps {
  setCalendarsData: (data: CalendarInfo[] | null) => void;
  setSharedCalendarsData: (data: CalendarInfo[] | null) => void;
  setNotificationsData: (data: NotificationItem[] | null) => void;
  setTokensList: (data: SharedTokenItem[]) => void;
  setLoadingStates: (updater: (prev: LoadingStates) => LoadingStates) => void;
  calendarsData?: CalendarInfo[] | null;
  sharedCalendarsData?: CalendarInfo[] | null;
}
