/* -------------------------------------------------------------------------- */
/* App Component Props Types                                                   */
/* -------------------------------------------------------------------------- */

export interface ArrowControlsProps {
  onLeft: () => void;
  onRight: () => void;
}

export interface ThemeToggleProps {
  className?: string;
}

export type DateLike = string | number | Date;

export interface WeekDayCirclesProps {
  selectedDate: Exclude<DateLike, number>;
  onSelectDate: (date: Date) => void;
}

export interface WeekCalendarSelectorProps {
  selectedDate?: DateLike | null;
  onWeekSelect: (date: Date) => void;
}

export interface WeeklyEventItem {
  start: string;
  title: string;
  color?: string;
  dose?: number | string | null;
  notes?: string | null;
  tablet_count?: number | string | null;
  [key: string]: unknown;
}

export interface WeeklyEventContentProps {
  ifModal: boolean;
  selectedDate: DateLike | null | undefined;
  eventsForDay: WeeklyEventItem[];
  onSelectDate: (date: Date) => void;
  onNext: () => void;
  onPrev: () => void;
  getPastWeek: () => void;
  getNextWeek: () => void;
}

export interface ActionSheetAction<TLabel = unknown> {
  label?: TLabel;
  title?: string;
  onClick?: () => void;
  linkTo?: string;
  danger?: boolean;
  separator?: boolean;
  dataTour?: string;
}

export interface ActionSheetProps<TLabel = unknown> {
  actions: ActionSheetAction<TLabel>[];
  buttonSize?: 'sm' | 'default' | string;
  dataTour?: string;
}

export interface IconButtonProps<TIcon = unknown> {
  className?: string;
  icon?: TIcon;
  text: string;
  onClick?: () => void;
  title?: string;
  disabled?: boolean;
  helpDisabled?: string;
}

export type ToastType = 'info' | 'success' | 'warning' | 'danger';

export type ConfirmDialogType = 'confirm-safe' | 'confirm-danger';

export type AlertType = ToastType | ConfirmDialogType;

export interface ConfirmDialogProps {
  type?: ConfirmDialogType;
  title?: string;
  message: string;
  onClose: () => void;
  onConfirm?: (() => void) | null;
}

export interface AlertSystemProps {
  type?: AlertType;
  title?: string;
  message: string;
  onClose: () => void;
  onConfirm?: (() => void) | null;
  duration?: number;
}

export interface ToastProps {
  type?: ToastType;
  message: string;
  onClose: () => void;
  duration?: number;
}

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

export type TooltipSide = 'top' | 'right' | 'bottom' | 'left';

export interface TooltipsProps<TNode = unknown> {
  children: TNode;
  content?: TNode;
  side?: TooltipSide;
  className?: string;
  propagation?: boolean;
}