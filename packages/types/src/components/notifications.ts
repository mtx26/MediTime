import type { UserProfile, CalendarInfo } from '../models/common';
import type { NotificationItem } from '../models/realtime';

export interface HoveredUserProfileProps<TTrigger = unknown> {
  user: UserProfile;
  trigger: TTrigger;
}

export interface NotificationLineProps {
  notif: NotificationItem;
  onRead: (notificationId: string) => void;
}

export interface HeaderNotificationsState {
  notificationsData: NotificationItem[] | null;
  readNotification: (notificationId: string) => void;
  readAllNotifications: () => void;
}

export interface HeaderSharedProps {
  personalCalendars: {
    calendarsData?: CalendarInfo[];
  };
  sharedUserCalendars: {
    sharedCalendarsData?: CalendarInfo[];
  };
  notifications: HeaderNotificationsState;
}

export interface NotificationsPageProps {
  notifications: HeaderNotificationsState;
}
