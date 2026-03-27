/* -------------------------------------------------------------------------- */
/* Web App Shared Props Types                                                 */
/* -------------------------------------------------------------------------- */

export interface LoadingStates {
  isInitialLoading: boolean;
  [key: string]: boolean;
}

export interface AppSharedProps {
  loadingStates: LoadingStates;
  personalCalendars: Record<string, unknown>;
  sharedUserCalendars: Record<string, unknown>;
  tokenCalendars: Record<string, unknown>;
  notifications: Record<string, unknown>;
  fcm: Record<string, unknown>;
  user: Record<string, unknown>;
}

export interface UserInfo {
  displayName: string | null;
  email: string | null;
  photoUrl: string | null;
  emailEnabled: boolean;
  pushEnabled: boolean;
  uid: string;
}

export interface UserContextValue {
  userInfo: UserInfo | null;
  recoveryEvent: boolean;
}
