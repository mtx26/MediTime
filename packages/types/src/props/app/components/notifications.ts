import type { UserProfile, CalendarInfo } from '../../../models/common';

export interface HoveredUserProfileProps<TTrigger = unknown> {
  user: UserProfile;
  trigger: TTrigger;
}

export type AppNotificationType =
  | 'calendar_invitation'
  | 'calendar_invitation_accepted'
  | 'calendar_invitation_rejected'
  | 'calendar_shared_deleted_by_owner'
  | 'calendar_shared_deleted_by_receiver'
  | 'low_stock';

export interface AppNotification {
  notification_id: string;
  notification_type: AppNotificationType;
  read: boolean;
  timestamp: string;
  sender_name?: string | null;
  sender_photo_url?: string | null;
  sender_email?: string | null;
  calendar_name?: string | null;
  calendar_id?: string | null;
  accepted?: boolean;
  token?: string | null;
  medication_name?: string | null;
  medication_qty?: number | null;
}

export interface NotificationLineProps {
  notif: AppNotification;
  onRead: (notificationId: string) => void;
}

export interface HeaderNotificationsState {
  notificationsData: AppNotification[] | null;
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
