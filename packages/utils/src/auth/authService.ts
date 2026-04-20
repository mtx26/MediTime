import { log } from '../log';

// Minimal Supabase client interface — avoids depending on @supabase/supabase-js
interface AuthError {
  message: string;
  code?: string;
}

interface AuthResponse {
  error: AuthError | null;
}

interface SupabaseAuthClient {
  signInWithPassword(credentials: { email: string; password: string }): Promise<AuthResponse>;
  signUp(credentials: {
    email: string;
    password: string;
    options?: { emailRedirectTo?: string; data?: Record<string, unknown> };
  }): Promise<AuthResponse>;
  signOut(): Promise<{ error: AuthError | null }>;
  resetPasswordForEmail(email: string, options?: { redirectTo?: string }): Promise<AuthResponse>;
  signInWithOtp(credentials: {
    email: string;
    options?: { emailRedirectTo?: string };
  }): Promise<AuthResponse>;
  updateUser(attributes: Record<string, unknown>): Promise<AuthResponse>;
  signInWithOAuth(credentials: {
    provider: string;
    options?: Record<string, unknown>;
  }): Promise<AuthResponse>;
}

interface SupabaseClient {
  auth: SupabaseAuthClient;
}

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

/**
 * Creates a platform-agnostic auth service.
 * Web and mobile each pass their own Supabase client instance.
 */
export function createAuthService(
  supabase: SupabaseClient,
  buildCallbackUrl: (redirect?: string, type?: string) => string,
) {
  async function loginWithEmail(email: string, password: string): Promise<AuthError | null> {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        log.error('Erreur lors de la connexion avec email :', error, {
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
  }

  async function registerWithEmail(
    email: string,
    password: string,
    name: string,
    redirect?: string,
  ): Promise<AuthError | null> {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: buildCallbackUrl(redirect, 'signup'),
          data: { full_name: name },
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
  }

  async function handleLogout(): Promise<void> {
    try {
      await supabase.auth.signOut();
    } catch (error: unknown) {
      log.error('Erreur de déconnexion :', {
        origin: 'HANDLE_LOGOUT',
        uid: null,
        error,
      });
    }
  }

  async function resetPassword(email: string): Promise<void> {
    try {
      await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: buildCallbackUrl(undefined, 'recovery'),
      });
    } catch (error: unknown) {
      log.error("Erreur lors de l'envoi de l'email de réinitialisation :", {
        origin: 'RESET_PASSWORD',
        uid: null,
        error,
      });
    }
  }

  async function loginWithMagicLink(email: string, redirect?: string): Promise<AuthError | null> {
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: buildCallbackUrl(redirect, 'magiclink'),
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
  }

  async function updateUserPassword(newPassword: string): Promise<void> {
    try {
      await supabase.auth.updateUser({ password: newPassword });
    } catch (error: unknown) {
      log.error('Erreur lors de la mise à jour du mot de passe', {
        origin: 'UPDATE_USER_PASSWORD',
        uid: null,
        error,
      });
    }
  }

  async function updateUserEmail(newEmail: string): Promise<AuthError | null> {
    try {
      const { error } = await supabase.auth.updateUser({ email: newEmail });
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
  }

  async function handleOAuthLogin(
    provider: string,
    redirect?: string,
    providerLabel?: string,
    origin?: string,
  ): Promise<void> {
    const { getOAuthSignInOptions } = await import('./authUtils');
    try {
      await supabase.auth.signInWithOAuth({
        provider,
        options: getOAuthSignInOptions(provider, buildCallbackUrl(redirect, 'oauth')) as unknown as Record<string, unknown>,
      });
    } catch (err: unknown) {
      log.error(getErrorMessage(err, `Erreur lors de la connexion avec ${providerLabel ?? provider}`), err, {
        origin: origin ?? `${provider.toUpperCase()}_HANDLE_LOGIN`,
        uid: null,
      });
    }
  }

  return {
    loginWithEmail,
    registerWithEmail,
    handleLogout,
    resetPassword,
    loginWithMagicLink,
    updateUserPassword,
    updateUserEmail,
    handleOAuthLogin,
  };
}

export type AuthService = ReturnType<typeof createAuthService>;
