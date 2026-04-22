import { useEffect, useMemo, useRef, useState } from 'react';
import { Linking } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { getFirstRouteParams, getValidRedirect, log } from '@meditime/utils';
import type { SessionLike } from '@meditime/types';
import { useAuth } from './useAuth';
import { supabase } from '../../services/supabase';
import { applySupabaseAuthParams, collectAuthCallbackParams, toMobileHref } from '../../utils';

type RouteParamValue = string | string[] | undefined;
type CallbackParams = Record<string, string | undefined>;

const DEFAULT_REDIRECT = '/calendars';
const LOGIN_ROUTE = '/(auth)/login';
const SESSION_ERROR_KEY = 'auth_callback.session_error';

const REDIRECT_BY_TYPE = new Map([
  ['recovery', '/(auth)/reset-password-confirm'],
  ['invite', '/(auth)/reset-password-confirm'],
  ['email_change', '/settings'],
  ['reauthentication', '/settings'],
  ['magiclink', DEFAULT_REDIRECT],
  ['signup', DEFAULT_REDIRECT],
]);

const RECOVERY_TYPES = new Set(['recovery', 'invite']);

function getRouteParams(params: Record<string, RouteParamValue>) {
  return getFirstRouteParams(params);
}

async function collectCallbackParams(routeParams: CallbackParams) {
  const initialUrl = await Linking.getInitialURL();
  return {
    ...collectAuthCallbackParams(initialUrl),
    ...routeParams,
  };
}

function getRedirectPath(type: string | undefined, redirect: string | undefined) {
  const validRedirect = getValidRedirect(redirect);

  if (validRedirect?.startsWith('/')) {
    return toMobileHref(validRedirect);
  }

  return REDIRECT_BY_TYPE.get(String(type)) ?? DEFAULT_REDIRECT;
}

function isPasswordRecoveryType(type: string | undefined) {
  return RECOVERY_TYPES.has(String(type));
}

export function useAuthCallback() {
  const { t } = useTranslation();
  const router = useRouter();
  const routeParams = useLocalSearchParams();
  const { reloadUser } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [callbackType, setCallbackType] = useState<string | null>(null);
  const processedRef = useRef(false);

  const routeCallbackParams = useMemo(
    () => getRouteParams(routeParams as Record<string, RouteParamValue>),
    [routeParams],
  );

  useEffect(() => {
    if (processedRef.current) return;
    processedRef.current = true;

    let active = true;
    setError(null);
    setLoading(true);

    const resolveCallback = async () => {
      try {
        const params = await collectCallbackParams(routeCallbackParams);
        const type = params.type;
        setCallbackType(type ?? null);

        await applySupabaseAuthParams(supabase, params);

        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError || !session?.user) {
          throw sessionError ?? new Error(String(t(SESSION_ERROR_KEY)));
        }

        await reloadUser(session as SessionLike);

        log.info(String(t('auth_callback.success')), {
          origin: 'CALLBACK_SUCCESS',
          uid: session.user.id,
          type,
          redirect: params.redirect,
        });

        router.replace(getRedirectPath(type, params.redirect) as never);
      } catch (callbackError) {
        if (!active) return;

        log.error(String(t(SESSION_ERROR_KEY)), {
          origin: 'CALLBACK_ERROR',
          uid: null,
          error: callbackError,
        });
        setError(callbackError instanceof Error ? callbackError.message : String(t(SESSION_ERROR_KEY)));
        setLoading(false);
      }
    };

    void resolveCallback();

    return () => {
      active = false;
    };
  }, [reloadUser, routeCallbackParams, router, t]);

  return {
    error,
    loading,
    isRecovery: isPasswordRecoveryType(callbackType ?? routeCallbackParams.type),
    backToLogin: () => router.replace(LOGIN_ROUTE),
    requestNewResetLink: () => router.replace('/(auth)/reset-password'),
  };
}
