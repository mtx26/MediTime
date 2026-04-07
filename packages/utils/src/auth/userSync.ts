import type { UserInfo } from '@meditime/types';

interface UserApiResponseData {
  display_name?: string | null;
  email?: string | null;
  photo_url?: string | null;
  email_enabled?: boolean;
  push_enabled?: boolean;
}

/**
 * Map raw API response data to a UserInfo object.
 */
export function mapApiResponseToUserInfo(
  data: UserApiResponseData,
  uid: string,
): UserInfo {
  return {
    displayName: data.display_name ?? null,
    email: data.email ?? null,
    photoUrl: data.photo_url ?? null,
    emailEnabled: Boolean(data.email_enabled),
    pushEnabled: Boolean(data.push_enabled),
    uid,
  };
}

interface SupabaseUserMetadata {
  full_name?: string;
  name?: string;
  avatar_url?: string;
}

interface UserCreationPayload {
  uid: string;
  display_name: string | null;
  email: string | null;
  photo_url: string | null;
  email_enabled: boolean;
  push_enabled: boolean;
}

/**
 * Build the user creation payload from auth metadata.
 */
export function buildUserCreationPayload(
  uid: string,
  email: string | undefined,
  metadata: SupabaseUserMetadata,
): UserCreationPayload {
  return {
    uid,
    display_name:
      metadata.full_name ??
      metadata.name ??
      null,
    email: email || null,
    photo_url: metadata.avatar_url ?? null,
    email_enabled: true,
    push_enabled: true,
  };
}
