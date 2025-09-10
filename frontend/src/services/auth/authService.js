import { auth } from '../firebase/firebase';
import {
  GoogleAuthProvider,
  GithubAuthProvider,
  TwitterAuthProvider,
  FacebookAuthProvider,
  OAuthProvider,
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  updatePassword,
  updateEmail,
  reauthenticateWithCredential,
  EmailAuthProvider,
  updateProfile,
} from 'firebase/auth';
import { log } from '../../utils/logger';
import { performApiCall } from '../../services/api/apiUtils';
import { getGlobalReloadUser } from '../../contexts/UserContext';

const API_URL = import.meta.env.VITE_API_URL;

function providerFor(name) {
  switch (name) {
    case 'google':
      return new GoogleAuthProvider();
    case 'github':
      return new GithubAuthProvider();
    case 'twitter':
      return new TwitterAuthProvider();
    case 'facebook':
      return new FacebookAuthProvider();
    case 'discord':
      return new OAuthProvider('oidc.discord');
    case 'azure':
      return new OAuthProvider('microsoft.com');
    default:
      throw new Error('Unknown provider');
  }
}

export async function updateUserInfo({
  display_name,
  email,
  photo_url,
  email_enabled,
  push_enabled,
  uid,
}) {
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

async function loginWithProvider(name) {
  try {
    const provider = providerFor(name);
    await signInWithPopup(auth, provider);
  } catch (err) {
    log.error(err.message || `Erreur lors de la connexion avec ${name}`, err, {
      origin: `${name.toUpperCase()}_HANDLE_LOGIN`,
      uid: null,
    });
  }
}

export const GoogleHandleLogin = (redirect) => loginWithProvider('google');
export const GithubHandleLogin = (redirect) => loginWithProvider('github');
export const TwitterHandleLogin = (redirect) => loginWithProvider('twitter');
export const FacebookHandleLogin = (redirect) => loginWithProvider('facebook');
export const DiscordHandleLogin = (redirect) => loginWithProvider('discord');
export const MicrosoftHandleLogin = (redirect) => loginWithProvider('azure');

export const registerWithEmail = async (email, password, name) => {
  try {
    const { user } = await createUserWithEmailAndPassword(auth, email, password);
    if (name) await updateProfile(user, { displayName: name });
    return null;
  } catch (error) {
    log.error("Erreur lors de l'inscription avec email :", error.message, {
      origin: 'REGISTER_WITH_EMAIL',
      uid: null,
    });
    return error;
  }
};

export const loginWithEmail = async (email, password) => {
  try {
    await signInWithEmailAndPassword(auth, email, password);
    return null;
  } catch (error) {
    log.error('Erreur lors de la connexion avec email :', error.message, {
      origin: 'LOGIN_WITH_EMAIL',
      uid: null,
    });
    return error;
  }
};

export const resetPassword = async (email) => {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error) {
    log.error("Erreur lors de l'envoi de l'email de réinitialisation :", error.message, {
      origin: 'RESET_PASSWORD',
      uid: null,
    });
  }
};

export const handleLogout = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    log.error('Erreur de déconnexion :', error.message, {
      origin: 'HANDLE_LOGOUT',
      uid: null,
    });
  }
};

export const updateUserPassword = async (newPassword) => {
  try {
    if (auth.currentUser) {
      await updatePassword(auth.currentUser, newPassword);
    }
  } catch (error) {
    log.error('Erreur lors de la mise à jour du mot de passe', error.message, {
      origin: 'UPDATE_USER_PASSWORD',
      uid: null,
    });
  }
};

export const loginWithMagicLink = async (email, redirect) => {
  log.info('loginWithMagicLink non implémenté', {
    origin: 'LOGIN_WITH_MAGIC_LINK',
    uid: null,
  });
};

export const updateUserEmail = async (newEmail) => {
  try {
    if (auth.currentUser) {
      await updateEmail(auth.currentUser, newEmail);
    }
    return null;
  } catch (error) {
    log.error("Erreur lors du changement d'email", error.message, {
      origin: 'UPDATE_USER_EMAIL',
      uid: null,
    });
    return error;
  }
};

export const reauthenticateUser = async (password) => {
  try {
    const user = auth.currentUser;
    if (user && user.email) {
      const cred = EmailAuthProvider.credential(user.email, password);
      await reauthenticateWithCredential(user, cred);
    }
  } catch (error) {
    log.error('Erreur lors de la réauthentification', error.message, {
      origin: 'REAUTHENTICATE_USER',
      uid: null,
    });
  }
};
