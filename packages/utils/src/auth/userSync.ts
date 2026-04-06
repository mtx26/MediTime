import type { UserInfo } from '@meditime/types';

/**
 * Map raw API response data to a UserInfo object.
 */
export function mapApiResponseToUserInfo(
  data: Record<string, unknown>,
  uid: string,
): UserInfo {
  return {
    displayName: (data.display_name as string | null | undefined) ?? null,
    email: (data.email as string | null | undefined) ?? null,
    photoUrl: (data.photo_url as string | null | undefined) ?? null,
    emailEnabled: Boolean(data.email_enabled),
    pushEnabled: Boolean(data.push_enabled),
    uid,
  };
}

/**
 * Build the user creation payload from auth metadata.
 */
export function buildUserCreationPayload(
  uid: string,
  email: string | undefined,
  metadata: Record<string, unknown>,
): Record<string, unknown> {
  return {
    uid,
    display_name:
      (metadata.full_name as string | undefined) ??
      (metadata.name as string | undefined) ??
      null,
    email: email || null,
    photo_url: (metadata.avatar_url as string | undefined) ?? null,
    email_enabled: true,
    push_enabled: true,
  };
}
