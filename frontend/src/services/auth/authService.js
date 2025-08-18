import { useContext } from 'react';
import { supabase } from '../supabase/supabaseClient';
import { log } from '../../utils/logger';
import { performApiCall } from '../../services/api/apiUtils';
import { getGlobalReloadUser } from '../../contexts/UserContext';

// URL de l'API
const API_URL = import.meta.env.VITE_API_URL;

function buildCallbackUrl(redirect) {
  const lang = window.location.pathname.split('/')[1] || '';
  return (
    window.location.origin +
    `/${lang}/auth/callback` +
    (redirect ? `?redirect=${encodeURIComponent(redirect)}` : '')
  );
}

export async function updateUserInfo({ display_name, email, photo_url, email_enabled, push_enabled, uid }) {
  
  const body = {
    display_name: display_name ?? null,
    email: email ?? null,
    photo_url: photo_url ?? null,
    email_enabled: email_enabled ?? null,
    push_enabled: push_enabled ?? null,
  };

  const response = await performApiCall({
    url: `${API_URL}/api/user/update`,
    method: 'POST',
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
  try {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: buildCallbackUrl(redirect),
        queryParams: {
          prompt: 'select_account',
          access_type: 'offline',
        },
        flowType: 'redirect',
      },
    });
  } catch (err) {
    log.error(err.message || 'Erreur lors de la connexion avec Google', err, {
      origin: 'GOOGLE_HANDLE_LOGIN',
      uid: null,
    });
  }
};

/**
 * Connexion avec Github
 */
export const GithubHandleLogin = async (redirect) => {
  try {
    await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: buildCallbackUrl(redirect),
        queryParams: {
          prompt: 'select_account',
          access_type: 'offline',
        },
        flowType: 'redirect',
      },
    });
  } catch (err) {
    log.error(err.message || 'Erreur lors de la connexion avec Github', err, {
      origin: 'GITHUB_HANDLE_LOGIN',
      uid: null,
    });
  }
};

/**
 * Connexion avec Twitter
 */
export const TwitterHandleLogin = async (redirect) => {
  try {
    await supabase.auth.signInWithOAuth({
      provider: 'twitter',
      options: {
        redirectTo: buildCallbackUrl(redirect),
        queryParams: {
          prompt: 'select_account',
          access_type: 'offline',
        },
        flowType: 'redirect',
      },
    });
  } catch (err) {
    log.error(err.message || 'Erreur lors de la connexion avec Twitter', err, {
      origin: 'TWITTER_HANDLE_LOGIN',
      uid: null,
    });
  }
};

/**
 * Connexion avec Facebook
 */
export const FacebookHandleLogin = async (redirect) => {
  try {
    await supabase.auth.signInWithOAuth({
      provider: 'facebook',
      options: {
        redirectTo: buildCallbackUrl(redirect),
        queryParams: {
          prompt: 'select_account',
          access_type: 'offline',
        },
        flowType: 'redirect',
      },
    });
  } catch (err) {
    log.error(err.message || 'Erreur lors de la connexion avec Facebook', err, {
      origin: 'FACEBOOK_HANDLE_LOGIN',
      uid: null,
    });
  }
};

/**
 * Connexion avec Discord
 */
export const DiscordHandleLogin = async (redirect) => {
  try {
    await supabase.auth.signInWithOAuth({
      provider: 'discord',
      options: {
        redirectTo: buildCallbackUrl(redirect),
        queryParams: {
          prompt: 'select_account',
          access_type: 'offline',
        },
        flowType: 'redirect',
      },
    });
  } catch (err) {
    log.error(err.message || 'Erreur lors de la connexion avec Discord', err, {
      origin: 'DISCORD_HANDLE_LOGIN',
      uid: null,
    });
  }
};

/**
 * Connexion avec Microsoft
 */
export const MicrosoftHandleLogin = async (redirect) => {
  try {
    await supabase.auth.signInWithOAuth({
      provider: 'azure',
      options: {
        redirectTo: buildCallbackUrl(redirect),
        queryParams: {
          prompt: 'select_account',
          access_type: 'offline',
        },
        flowType: 'redirect',
      },
    });
  } catch (err) {
    log.error(err.message || 'Erreur lors de la connexion avec Microsoft', err, {
      origin: 'MICROSOFT_HANDLE_LOGIN',
      uid: null,
    });
  }
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
export const loginWithEmail = async (email, password, redirect) => {
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

    window.location.href = buildCallbackUrl(redirect);
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
    await supabase.auth.signOut({
      options: {
        redirectTo: buildCallbackUrl(),
      },
    });
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
        redirectTo: buildCallbackUrl(),
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
    await supabase.auth.reauthenticate({
      redirectTo: buildCallbackUrl(),
    });
  } catch (error) {
    log.error('Erreur lors de la réauthentification', error.message, {
      origin: 'REAUTHENTICATE_USER',
      uid: null,
    });
  }
};
