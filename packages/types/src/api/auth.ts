// ─── Authentication Types ────────────────────────────────────────────────────

export type OAuthProvider = 'google' | 'github' | 'twitter' | 'facebook' | 'discord' | 'azure';

export interface OAuthLoginOptions {
  provider: OAuthProvider;
  redirect?: string;
  origin: string;
  providerLabel: string;
}

export interface UpdateUserInfoPayload {
  display_name: string | null;
  email: string | null;
  photo_url: string | null;
  email_enabled: boolean;
  push_enabled: boolean;
  uid: string;
}
