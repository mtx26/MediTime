import type { ApiResult, OAuthProvider } from '../api';

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

// ─── Mobile Settings ────────────────────────────────────────────────────────

export type SettingsTabId = 'account' | 'security' | 'notifications' | 'preferences';

export interface SettingsTabItem<TIconName = string> {
  id: SettingsTabId;
  label: string;
  iconName: TIconName;
}

export interface SettingsTabBarProps<TIconName = string> {
  tabs: SettingsTabItem<TIconName>[];
  activeTab: SettingsTabId;
  onTabChange: (tab: SettingsTabId) => void;
}

export interface SettingsPanelSectionProps<TIconName = string, TNode = unknown> {
  title: string;
  description?: string;
  iconName: TIconName;
  children: TNode;
}

export interface MobileSecurityProviderItem<TIconName = string> {
  id: OAuthProvider;
  name: string;
  iconName: TIconName;
  color: string;
}

export interface MobileAccountSettingsProps {
  displayName: string;
  email: string;
  photoUrl: string | null;
  isSaving: boolean;
  onChangePhoto: () => void;
  onDisplayNameChange: (value: string) => void;
  onSaveDisplayName: () => void;
  onResetDisplayName: () => void;
}

export interface MobileSecuritySettingsProps<TIconName = string> {
  email: string;
  oldPassword: string;
  newPassword: string;
  oldPasswordVisible: boolean;
  newPasswordVisible: boolean;
  isSaving: boolean;
  providers: MobileSecurityProviderItem<TIconName>[];
  linkedProviders: string[];
  loadingProviders: boolean;
  connectingProvider: string | null;
  onOldPasswordChange: (value: string) => void;
  onNewPasswordChange: (value: string) => void;
  onOldPasswordVisibleChange: (value: boolean) => void;
  onNewPasswordVisibleChange: (value: boolean) => void;
  onUpdatePassword: () => void;
  onConnectProvider: (provider: OAuthProvider) => void;
}

export interface MobileNotificationSettingsProps {
  emailEnabled: boolean;
  pushEnabled: boolean;
  notificationTime: string;
  isSaving: boolean;
  onEmailEnabledChange: (value: boolean) => void;
  onPushEnabledChange: (value: boolean) => void;
  onNotificationTimeChange: (value: string) => void;
  onSaveNotificationTime: () => void;
}

export interface MobilePreferencesSettingsProps {
  language: string;
  languages: { code: string; label: string; flag: string }[];
  themePreference: 'light' | 'dark' | 'system';
  onLanguageChange: (value: string) => void;
  onThemePreferenceChange: (value: 'light' | 'dark' | 'system') => void;
}
