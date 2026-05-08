import { supabase } from '../supabase/supabaseClient';
import { log } from '@meditime/utils';
import { performApiCall } from '@meditime/utils';
import {
  buildAuthCallbackUrl,
  buildUserUpdatePayload,
  createAuthService,
} from '@meditime/utils';
import { getGlobalReloadUser } from '../../contexts/UserContext';
import type { UpdateUserInfoPayload } from '@meditime/types';

// URL de l'API
const API_URL = import.meta.env.VITE_API_URL;

function buildCallbackUrl(redirect?: string, type?: string): string {
  return buildAuthCallbackUrl(window.location.origin, redirect, '/auth/callback', type);
}

// ─── Shared auth service (used by both web & mobile) ────────────────────────
const shared = createAuthService(supabase, buildCallbackUrl);

export const loginWithEmail = shared.loginWithEmail;
export const registerWithEmail = shared.registerWithEmail;
export const handleLogout = shared.handleLogout;
export const resetPassword = shared.resetPassword;
export const loginWithMagicLink = shared.loginWithMagicLink;
export const updateUserPassword = shared.updateUserPassword;
export const updateUserEmail = shared.updateUserEmail;

// ─── OAuth convenience wrappers ─────────────────────────────────────────────
export const GoogleHandleLogin = (redirect?: string) =>
  shared.handleOAuthLogin('google', redirect, 'Google');

export const GithubHandleLogin = (redirect?: string) =>
  shared.handleOAuthLogin('github', redirect, 'Github');

export const TwitterHandleLogin = (redirect?: string) =>
  shared.handleOAuthLogin('twitter', redirect, 'Twitter');

export const FacebookHandleLogin = (redirect?: string) =>
  shared.handleOAuthLogin('facebook', redirect, 'Facebook');

export const DiscordHandleLogin = (redirect?: string) =>
  shared.handleOAuthLogin('discord', redirect, 'Discord');

export const MicrosoftHandleLogin = (redirect?: string) =>
  shared.handleOAuthLogin('azure', redirect, 'Microsoft');

// ─── Web-specific functions ─────────────────────────────────────────────────

export async function updateUserInfo({
  display_name,
  email,
  photo_url,
  email_enabled,
  push_enabled,
  uid,
}: UpdateUserInfoPayload): Promise<unknown> {
  const body = buildUserUpdatePayload({
    display_name,
    email,
    photo_url,
    email_enabled,
    push_enabled,
  });

  const response = (await performApiCall({
    url: `${API_URL}/api/user/update`,
    method: 'PUT',
    body,
    origin: 'USER_UPDATE',
    uid,
    analyticsEvent: 'update_user_info',
    analyticsData: { uid },
  })) as { success?: boolean };

  if (response.success) {
    const reloadUser = getGlobalReloadUser();
    void reloadUser();
  }

  return response;
}

export const reauthenticateUser = async (): Promise<void> => {
  try {
    await supabase.auth.reauthenticate();
  } catch (error: unknown) {
    log.error('Erreur lors de la réauthentification', {
      origin: 'REAUTHENTICATE_USER',
      uid: null,
      error,
    });
  }
};
