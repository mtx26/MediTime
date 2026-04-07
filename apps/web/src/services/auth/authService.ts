import { supabase } from '../supabase/supabaseClient';
import { log } from '@meditime/utils';
import { performApiCall } from '@meditime/utils';
import {
  buildAuthCallbackUrl,
  buildUserUpdatePayload,
  getOAuthSignInOptions,
} from '@meditime/utils';
import { getGlobalReloadUser } from '../../contexts/UserContext';
import type { OAuthLoginOptions, UpdateUserInfoPayload } from '@meditime/types';

// URL de l'API
const API_URL = import.meta.env.VITE_API_URL;

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

function buildCallbackUrl(redirect?: string): string {
  return buildAuthCallbackUrl(window.location.origin, redirect);
}

async function handleOAuthLogin({ provider, redirect, origin, providerLabel }: OAuthLoginOptions): Promise<void> {
  try {
    await supabase.auth.signInWithOAuth({
      provider,
      options: getOAuthSignInOptions(provider, buildCallbackUrl(redirect)),
    });
  } catch (err: unknown) {
    log.error(getErrorMessage(err, `Erreur lors de la connexion avec ${providerLabel}`), err, {
      origin,
      uid: null,
    });
  }
}

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

/**
 * Connexion avec Google
 */
export const GoogleHandleLogin = async (redirect?: string): Promise<void> => {
  return handleOAuthLogin({
    provider: 'google',
    redirect,
    origin: 'GOOGLE_HANDLE_LOGIN',
    providerLabel: 'Google',
  });
};

/**
 * Connexion avec Github
 */
export const GithubHandleLogin = async (redirect?: string): Promise<void> => {
  return handleOAuthLogin({
    provider: 'github',
    redirect,
    origin: 'GITHUB_HANDLE_LOGIN',
    providerLabel: 'Github',
  });
};

/**
 * Connexion avec Twitter
 */
export const TwitterHandleLogin = async (redirect?: string): Promise<void> => {
  return handleOAuthLogin({
    provider: 'twitter',
    redirect,
    origin: 'TWITTER_HANDLE_LOGIN',
    providerLabel: 'Twitter',
  });
};

/**
 * Connexion avec Facebook
 */
export const FacebookHandleLogin = async (redirect?: string): Promise<void> => {
  return handleOAuthLogin({
    provider: 'facebook',
    redirect,
    origin: 'FACEBOOK_HANDLE_LOGIN',
    providerLabel: 'Facebook',
  });
};

/**
 * Connexion avec Discord
 */
export const DiscordHandleLogin = async (redirect?: string): Promise<void> => {
  return handleOAuthLogin({
    provider: 'discord',
    redirect,
    origin: 'DISCORD_HANDLE_LOGIN',
    providerLabel: 'Discord',
  });
};

/**
 * Connexion avec Microsoft
 */
export const MicrosoftHandleLogin = async (redirect?: string): Promise<void> => {
  return handleOAuthLogin({
    provider: 'azure',
    redirect,
    origin: 'MICROSOFT_HANDLE_LOGIN',
    providerLabel: 'Microsoft',
  });
};

  /**
 * Inscription avec email et mot de passe
 */
export const registerWithEmail = async (
  email: string,
  password: string,
  name: string,
  redirect?: string
): Promise<unknown | null> => {
  try {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: buildCallbackUrl(redirect),
        data: {
          full_name: name,
        },
      },
    });
    if (error) {
      log.error("Erreur lors de l'inscription avec email :", error, {
        origin: 'REGISTER_WITH_EMAIL',
        uid: null,
      });
      return error;
    }
    return null;

  } catch (error: unknown) {
    log.error("Erreur lors de l'inscription avec email :", {
      origin: 'REGISTER_WITH_EMAIL',
      uid: null,
      error,
    });
    return null;
  }
};

/**
 * Connexion avec email et mot de passe
 */
export const loginWithEmail = async (email: string, password: string): Promise<unknown | null> => {
  try {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      log.error("Erreur lors de la connexion avec email :", error, {
        origin: 'LOGIN_WITH_EMAIL',
        uid: null,
      });
      return error;
    }

    return null;
  } catch (error: unknown) {
    log.error('Erreur lors de la connexion avec email :', {
      origin: 'LOGIN_WITH_EMAIL',
      uid: null,
      error,
    });
    return null;
  }
};

/**
 * Envoie un email de réinitialisation du mot de passe
 */
export const resetPassword = async (email: string): Promise<void> => {
  try {
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: buildCallbackUrl(),
    });
  } catch (error: unknown) {
    log.error(
      "Erreur lors de l'envoi de l'email de réinitialisation :",
      {
        origin: 'RESET_PASSWORD',
        uid: null,
        error,
      }
    );
  }
};

/**
 * Déconnexion
 */
export const handleLogout = async (): Promise<void> => {
  try {
    await supabase.auth.signOut();
  } catch (error: unknown) {
    log.error('Erreur de déconnexion :', {
      origin: 'HANDLE_LOGOUT',
      uid: null,
      error,
    });
  }
};

/**
 * Mise à jour du mot de passe utilisateur
 */
export const updateUserPassword = async (newPassword: string): Promise<void> => {
  try {
    await supabase.auth.updateUser({
      password: newPassword,
    } as never);
  } catch (error: unknown) {
    log.error('Erreur lors de la mise à jour du mot de passe', {
      origin: 'UPDATE_USER_PASSWORD',
      uid: null,
      error,
    });
  }
};

/**
 * Connexion via Magic Link (OTP)
 */
export const loginWithMagicLink = async (email: string, redirect?: string): Promise<unknown | null> => {
  try {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: buildCallbackUrl(redirect),
      },
    });
    if (error) {
      log.error('Erreur lors de la connexion par magic link :', error.message, {
        origin: 'LOGIN_WITH_MAGIC_LINK',
        uid: null,
      });
      return error;
    }
    return null;
  } catch (error: unknown) {
    log.error('Erreur lors de la connexion par magic link :', {
      origin: 'LOGIN_WITH_MAGIC_LINK',
      uid: null,
      error,
    });
    return null;
  }
};

/**
 * Mise à jour de l'email utilisateur
 */
export const updateUserEmail = async (newEmail: string): Promise<unknown | null> => {
  try {
    const { error } = await supabase.auth.updateUser({
      email: newEmail,
    } as never);
    if (error) {
      log.error("Erreur lors du changement d'email", error, {
        origin: 'UPDATE_USER_EMAIL',
        uid: null,
      });
      return error;
    }
    return null;
  } catch (error: unknown) {
    log.error("Erreur lors du changement d'email", {
      origin: 'UPDATE_USER_EMAIL',
      uid: null,
      error,
    });
    return null;
  }
};

/**
 * Réauthentification de l'utilisateur
 */
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
