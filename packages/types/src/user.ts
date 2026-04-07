// ─── User Context Types ──────────────────────────────────────────────────────

export interface UserInfo {
  displayName: string | null;
  email: string | null;
  photoUrl: string | null;
  emailEnabled: boolean;
  pushEnabled: boolean;
  uid: string;
  role?: string | null;
  provider?: string | null;
  emailVerified?: boolean;
}

export interface UserContextValue {
  userInfo: UserInfo | null;
  recoveryEvent: boolean;
}

// ─── Session & Provider Types ────────────────────────────────────────────────

export type SessionLike = {
  access_token: string;
  user?: {
    id: string;
    email?: string | null;
    user_metadata?: Record<string, unknown>;
  } | null;
} | null;

export type ReloadUserFn = (currentSession?: SessionLike) => Promise<void>;

export interface UserProviderProps<TNode = unknown> {
  children: TNode;
}
