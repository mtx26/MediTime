import type { CalendarInfo } from '../models/common';
import type { NotificationItem, SharedTokenItem } from '../models/realtime';
import type { LoadingStates } from '../app';

/** Equivalent to React's Dispatch<SetStateAction<T>> without a React dependency. */
type StateSetter<T> = (value: T | ((prev: T) => T)) => void;

export interface RealtimeManagerProps {
  setCalendarsData: StateSetter<CalendarInfo[] | null>;
  setSharedCalendarsData: StateSetter<CalendarInfo[] | null>;
  setNotificationsData: StateSetter<NotificationItem[] | null>;
  setTokensList: StateSetter<SharedTokenItem[]>;
  setLoadingStates: StateSetter<LoadingStates>;
  calendarsData?: CalendarInfo[] | null;
  sharedCalendarsData?: CalendarInfo[] | null;
}
