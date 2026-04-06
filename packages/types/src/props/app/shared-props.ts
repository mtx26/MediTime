// ─── App Shared Props ────────────────────────────────────────────────────────

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
