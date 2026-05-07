import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useForm, useWatch } from 'react-hook-form';
import { getOAuthSignInOptions, log } from '@meditime/utils';
import type { AuthMode, OAuthProvider, SessionLike } from '@meditime/types';
import { authService } from '../../contexts/AuthContext';
import { useAuth } from './useAuth';
import { supabase } from '../../services/supabase';
import {
  applySupabaseAuthCallback,
  buildMobileAuthCallbackUrl,
  openAuthUrlInApp,
} from '../../utils';

const socialProviders: {
  id: OAuthProvider;
  labelKey: string;
  ariaKey: string;
  iconName: string;
  color: string;
}[] = [
  { id: 'google', labelKey: 'auth.provider.google', ariaKey: 'auth.with_google', iconName: 'logo-google', color: '#DB4437' },
  { id: 'github', labelKey: 'auth.provider.github', ariaKey: 'auth.with_github', iconName: 'logo-github', color: '#111111' },
  { id: 'discord', labelKey: 'auth.provider.discord', ariaKey: 'auth.with_discord', iconName: 'logo-discord', color: '#5865F2' },
  { id: 'twitter', labelKey: 'auth.provider.twitter', ariaKey: 'auth.with_twitter', iconName: 'logo-twitter', color: '#111111' },
  { id: 'facebook', labelKey: 'auth.provider.facebook', ariaKey: 'auth.with_facebook', iconName: 'logo-facebook', color: '#1877F2' },
  { id: 'azure', labelKey: 'auth.provider.microsoft', ariaKey: 'auth.with_microsoft', iconName: 'logo-windows', color: '#5E5E5E' },
];

export function useAuthForm(initialMode: AuthMode) {
  const { t } = useTranslation();
  const router = useRouter();
  const { reloadUser } = useAuth();
  const [activeMode, setActiveMode] = useState<AuthMode>(initialMode);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<OAuthProvider | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const form = useForm<{
    name: string;
    email: string;
    password: string;
    termsAccepted: boolean;
  }>({
    mode: 'onChange',
    defaultValues: {
      name: '',
      email: '',
      password: '',
      termsAccepted: false,
    },
  });

  useEffect(() => {
    form.register('name', {
      validate: (value) => activeMode === 'login' || value.trim().length > 0,
    });
    form.register('email', {
      validate: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
        || String(t('supabase-error.invalid_email')),
    });
    form.register('password', {
      validate: (value) => value.length > 0,
    });
    form.register('termsAccepted', {
      validate: (value) => activeMode === 'login' || value || String(t('auth.accept_terms_aria')),
    });
    void form.trigger();
  }, [activeMode, form, t]);

  const values = useWatch({ control: form.control });
  const name = values.name ?? '';
  const email = values.email ?? '';
  const password = values.password ?? '';
  const termsAccepted = values.termsAccepted ?? false;
  const emailValid = !email.trim() || !form.formState.errors.email;
  const canSubmit = form.formState.isValid;

  const providers = useMemo(() => socialProviders.map((provider) => ({
    ...provider,
    label: String(t(provider.labelKey)),
    ariaLabel: String(t(provider.ariaKey)),
  })), [t]);

  const switchMode = useCallback((mode: AuthMode) => {
    setActiveMode(mode);
    setError(null);
    setSuccess(false);
    form.clearErrors();
  }, [form]);

  const handleSubmit = form.handleSubmit(async (values) => {
    const trimmedEmail = values.email.trim();
    const trimmedName = values.name.trim();
    setError(null);
    setLoading(true);

    try {
      if (activeMode === 'login') {
        const authError = await authService.loginWithEmail(trimmedEmail, values.password);
        if (authError) {
          const code = authError.code ?? 'unexpected_error';
          setError(String(t(`supabase-error.${code}`)));
          return;
        }

        log.info('Connexion reussie', {
          id: 'LOGIN-SUCCESS',
          origin: 'MobileAuth',
        });
        return;
      }

      if (!termsAccepted) {
        setError(String(t('auth.accept_terms_aria')));
        return;
      }

      const authError = await authService.registerWithEmail(trimmedEmail, values.password, trimmedName);
      if (authError) {
        const code = authError.code ?? 'unexpected_error';
        setError(String(t(`supabase-error.${code}`)));
        return;
      }

      setSuccess(true);
      log.info('Inscription reussie', {
        id: 'REGISTER-SUCCESS',
        origin: 'MobileAuth',
      });
    } catch (submitError) {
      log.error('Supabase auth error', {
        id: 'AUTH-ERROR',
        origin: 'MobileAuth',
        error: submitError,
      });
      setError(String(t('supabase-error.unexpected_error')));
    } finally {
      setLoading(false);
    }
  }, (errors) => {
    setError(errors.email?.message ?? errors.termsAccepted?.message ?? null);
  });

  const handleSocialLogin = useCallback(async (provider: OAuthProvider) => {
    setError(null);
    setSocialLoading(provider);

    try {
      const options = {
        ...getOAuthSignInOptions(provider, buildMobileAuthCallbackUrl(undefined, 'oauth')),
        skipBrowserRedirect: true,
      };
      const { data, error: oauthError } = await supabase.auth.signInWithOAuth({
        provider,
        options,
      });

      if (oauthError) {
        const code = oauthError.code ?? 'unexpected_error';
        setError(String(t(`supabase-error.${code}`)));
        return;
      }

      if (data.url) {
        const callbackUrl = await openAuthUrlInApp(data.url);
        if (!callbackUrl) return;

        await applySupabaseAuthCallback(supabase, callbackUrl);

        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError || !session?.user) {
          throw sessionError ?? new Error(String(t('auth_callback.session_error')));
        }

        await reloadUser(session as SessionLike);
        router.replace('/calendars' as never);
      }
    } catch (oauthError) {
      log.error('OAuth mobile error', {
        id: 'MOBILE-OAUTH-ERROR',
        origin: 'MobileAuth',
        provider,
        error: oauthError,
      });
      setError(String(t('supabase-error.oauth_callback_error')));
    } finally {
      setSocialLoading(null);
    }
  }, [reloadUser, router, t]);

  return {
    activeMode,
    email,
    password,
    name,
    passwordVisible,
    termsAccepted,
    loading,
    socialLoading,
    error,
    success,
    canSubmit,
    emailValid,
    providers,
    setEmail: (value: string) => {
      setError(null);
      form.setValue('email', value, { shouldDirty: true, shouldTouch: true, shouldValidate: true });
    },
    setPassword: (value: string) => {
      setError(null);
      form.setValue('password', value, { shouldDirty: true, shouldTouch: true, shouldValidate: true });
    },
    setName: (value: string) => {
      setError(null);
      form.setValue('name', value, { shouldDirty: true, shouldTouch: true, shouldValidate: true });
    },
    setPasswordVisible,
    setTermsAccepted: (value: boolean) => {
      setError(null);
      form.setValue('termsAccepted', value, { shouldDirty: true, shouldTouch: true, shouldValidate: true });
    },
    switchMode,
    handleSubmit,
    handleSocialLogin,
    goToResetPassword: () => router.push('/(auth)/reset-password'),
    goToTerms: () => router.push('/terms'),
    goToLogin: () => switchMode('login'),
  };
}
