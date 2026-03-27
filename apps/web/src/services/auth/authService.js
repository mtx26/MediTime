import { supabase } from '../supabase/supabaseClient';
import { log } from '@meditime/utils';
import { performApiCall } from '@meditime/utils';
import {
  buildAuthCallbackUrl,
  buildUserUpdatePayload,
  getOAuthSignInOptions,
} from '@meditime/utils';
import { getGlobalReloadUser } from '../../contexts/UserContext';

// URL de l'API
const API_URL = import.meta.env.VITE_API_URL;

function buildCallbackUrl(redirect) {
  return buildAuthCallbackUrl(window.location.origin, redirect);
}

async function handleOAuthLogin({ provider, redirect, origin, providerLabel }) {
  try {
    await supabase.auth.signInWithOAuth({
      provider,
      options: getOAuthSignInOptions(provider, buildCallbackUrl(redirect)),
    });
  } catch (err) {
    log.error(err.message || `Erreur lors de la connexion avec ${providerLabel}`, err, {
      origin,
      uid: null,
    });
  }
}

export async function updateUserInfo({ display_name, email, photo_url, email_enabled, push_enabled, uid }) {
  const body = buildUserUpdatePayload({
    display_name,
    email,
    photo_url,
    email_enabled,
    push_enabled,
  });

  const response = await performApiCall({
    url: `${API_URL}/api/user/update`,
    method: 'PUT',
    body,
    origin: 'USER_UPDATE',
    uid,
    analyticsEvent: 'update_user_info',
    analyticsData: { uid },
  });

  if (response.success) {
    const reloadUser = getGlobalReloadUser();
    reloadUser();
  }

  return response;
}

/**
 * Connexion avec Google
 */
export const GoogleHandleLogin = async (redirect) => {
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
export const GithubHandleLogin = async (redirect) => {
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
export const TwitterHandleLogin = async (redirect) => {
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
export const FacebookHandleLogin = async (redirect) => {
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
export const DiscordHandleLogin = async (redirect) => {
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
export const MicrosoftHandleLogin = async (redirect) => {
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
export const registerWithEmail = async (email, password, name, redirect) => {
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
      log.error("Erreur lors de l'inscription avec email :", error.message, error, {
        origin: 'REGISTER_WITH_EMAIL',
        uid: null,
      });
      return error;
    }
    return null;

  } catch (error) {
    log.error("Erreur lors de l'inscription avec email :", error.message, {
      origin: 'REGISTER_WITH_EMAIL',
      uid: null,
    });
  }
};

/**
 * Connexion avec email et mot de passe
 */
export const loginWithEmail = async (email, password) => {
  try {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      log.error("Erreur lors de la connexion avec email :", error.message, error, {
        origin: 'LOGIN_WITH_EMAIL',
        uid: null,
      });
      return error;
    }

    return null;
  } catch (error) {
    log.error('Erreur lors de la connexion avec email :', error.message, {
      origin: 'LOGIN_WITH_EMAIL',
      uid: null,
    });
  }
};

/**
 * Envoie un email de réinitialisation du mot de passe
 */
export const resetPassword = async (email) => {
  try {
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: buildCallbackUrl(),
    });
  } catch (error) {
    log.error(
      "Erreur lors de l'envoi de l'email de réinitialisation :",
      error.message,
      {
        origin: 'RESET_PASSWORD',
        uid: null,
      }
    );
  }
};

/**
 * Déconnexion
 */
export const handleLogout = async () => {
  try {
    await supabase.auth.signOut();
  } catch (error) {
    log.error('Erreur de déconnexion :', error.message, {
      origin: 'HANDLE_LOGOUT',
      uid: null,
    });
  }
};

/**
 * Mise à jour du mot de passe utilisateur
 */
export const updateUserPassword = async (newPassword) => {
  try {
    await supabase.auth.updateUser({
      password: newPassword,
      options: {
        emailRedirectTo: buildCallbackUrl(),
      },
    });
  } catch (error) {
    log.error('Erreur lors de la mise à jour du mot de passe', error.message, {
      origin: 'UPDATE_USER_PASSWORD',
      uid: null,
    });
  }
};

/**
 * Connexion via Magic Link (OTP)
 */
export const loginWithMagicLink = async (email, redirect) => {
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
  } catch (error) {
    log.error('Erreur lors de la connexion par magic link :', error.message, {
      origin: 'LOGIN_WITH_MAGIC_LINK',
      uid: null,
    });
  }
};

/**
 * Mise à jour de l'email utilisateur
 */
export const updateUserEmail = async (newEmail) => {
  try {
    const { error } = await supabase.auth.updateUser({
      email: newEmail,
      options: {
        emailRedirectTo: buildCallbackUrl(),
      },
    });
    if (error) {
      log.error("Erreur lors du changement d'email", error.message, {
        origin: 'UPDATE_USER_EMAIL',
        uid: null,
      });
      return error;
    }
    return null;
  } catch (error) {
    log.error("Erreur lors du changement d'email", error.message, {
      origin: 'UPDATE_USER_EMAIL',
      uid: null,
    });
  }
};

/**
 * Réauthentification de l'utilisateur
 */
export const reauthenticateUser = async () => {
  try {
    await supabase.auth.reauthenticate();
  } catch (error) {
    log.error('Erreur lors de la réauthentification', error.message, {
      origin: 'REAUTHENTICATE_USER',
      uid: null,
    });
  }
};
