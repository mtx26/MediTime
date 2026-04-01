export interface HoveredUserProfileUser {
  photo_url: string;
  display_name: string;
  email?: string | null;
}

export interface HoveredUserProfileProps<TTrigger = unknown> {
  user: HoveredUserProfileUser;
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
  notification_id: string | number;
  notification_type: AppNotificationType;
  read: boolean;
  timestamp: string;
  sender_name?: string | null;
  sender_photo_url?: string | null;
  sender_email?: string | null;
  calendar_name?: string | null;
  calendar_id?: string | number | null;
  accepted?: boolean;
  token?: string | null;
  medication_name?: string | null;
  medication_qty?: number | string | null;
}

export interface NotificationLineProps {
  notif: AppNotification;
  onRead: (notificationId: string | number) => void;
}

export interface CalendarHeaderInfo {
  id: string;
  name: string;
  owner_email?: string;
  owner_name?: string;
  owner_photo_url?: string;
}

export interface HeaderNotificationsState {
  notificationsData: AppNotification[] | null;
  readNotification: (notificationId: string | number) => void;
  readAllNotifications: () => void;
}

export interface HeaderSharedProps {
  personalCalendars: {
    calendarsData?: CalendarHeaderInfo[];
  };
  sharedUserCalendars: {
    sharedCalendarsData?: CalendarHeaderInfo[];
  };
  notifications: HeaderNotificationsState;
}
