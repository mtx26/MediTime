import type { ApiResult } from '../api';

// ─── FCM / Notification Settings ────────────────────────────────────────────

export interface FcmSettingsProps {
  sendTokenToBackend: () => Promise<ApiResult | null>;
}

export interface UserSettingsProps {
  fetchNotificationTime: () => Promise<ApiResult & { notification_time?: string }>;
  updateNotificationTime: (time: string) => Promise<ApiResult>;
}

export interface NotificationSettingsProps {
  fcm: FcmSettingsProps;
  user: UserSettingsProps;
}

// ─── Security Provider ───────────────────────────────────────────────────────

export interface SecurityProviderItem<TIcon = unknown> {
  id: string;
  name: string;
  color: string;
  icon: TIcon;
  handler: (redirect?: string | null) => Promise<void> | void;
}
