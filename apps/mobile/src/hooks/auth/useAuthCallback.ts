import { useEffect, useMemo, useRef, useState } from 'react';
import { Linking } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { getValidRedirect, log } from '@meditime/utils';
import type { SessionLike } from '@meditime/types';
import { useAuth } from './useAuth';
import { supabase } from '../../services/supabase';
import { applySupabaseAuthParams, collectAuthCallbackParams } from '../../utils';

type RouteParamValue = string | string[] | undefined;
type CallbackParams = Record<string, string | undefined>;

const redirectMap = new Map([
  ['recovery', '/(auth)/reset-password-confirm'],
  ['invite', '/(auth)/reset-password-confirm'],
  ['email_change', '/settings'],
  ['reauthentication', '/settings'],
  ['magiclink', '/calendars'],
  ['signup', '/calendars'],
]);

function firstParam(value: RouteParamValue) {
  return Array.isArray(value) ? value[0] : value;
}

function getRouteParams(params: Record<string, RouteParamValue>) {
  return Object.entries(params).reduce<CallbackParams>((acc, [key, value]) => {
    acc[key] = firstParam(value);
    return acc;
  }, {});
}

function normalizeRedirectPath(path: string) {
  const cleaned = path.replace(/^\/[a-z]{2}(?=\/|$)/, '');

  if (cleaned === '/login') return '/(auth)/login';
  if (cleaned === '/reset-password') return '/(auth)/reset-password';
  if (cleaned === '/reset-password-confirm') return '/(auth)/reset-password-confirm';
  if (cleaned.startsWith('/calendar/')) return `/calendars${cleaned}`;
  if (cleaned.startsWith('/shared-user-calendar/')) return `/calendars${cleaned}`;
  if (cleaned.startsWith('/shared-token-calendar/')) return `/calendars${cleaned}`;
  if (cleaned.startsWith('/settings')) return '/settings';

  return cleaned || '/calendars';
}

function getRedirectPath(type: string | undefined, redirect: string | undefined) {
  const validRedirect = getValidRedirect(redirect);

  if (validRedirect?.startsWith('/')) {
    return normalizeRedirectPath(validRedirect);
  }

  return redirectMap.get(String(type)) ?? '/calendars';
}

export function useAuthCallback() {
  const { t } = useTranslation();
  const router = useRouter();
  const routeParams = useLocalSearchParams();
  const { reloadUser } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const processedRef = useRef(false);

  const routeCallbackParams = useMemo(
    () => getRouteParams(routeParams as Record<string, RouteParamValue>),
    [routeParams],
  );

  useEffect(() => {
    if (processedRef.current) return;
    processedRef.current = true;

    const handleCallback = async () => {
      try {
        const initialUrl = await Linking.getInitialURL();
        const urlCallbackParams = collectAuthCallbackParams(initialUrl);
        const params = {
          ...urlCallbackParams,
          ...routeCallbackParams,
        };

        await applySupabaseAuthParams(supabase, params);

        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError || !session?.user) {
          throw sessionError ?? new Error(String(t('auth_callback.session_error')));
        }

        await reloadUser(session as SessionLike);

        log.info(String(t('auth_callback.success')), {
          origin: 'CALLBACK_SUCCESS',
          uid: session.user.id,
          type: params.type,
          redirect: params.redirect,
        });

        router.replace(getRedirectPath(params.type, params.redirect) as never);
      } catch (callbackError) {
        log.error(String(t('auth_callback.session_error')), {
          origin: 'CALLBACK_ERROR',
          uid: null,
          error: callbackError,
        });
        setError(callbackError instanceof Error ? callbackError.message : String(t('auth_callback.session_error')));
        setLoading(false);
      }
    };

    void handleCallback();
  }, [reloadUser, routeCallbackParams, router, t]);

  return {
    error,
    loading,
    backToLogin: () => router.replace('/(auth)/login'),
  };
}
