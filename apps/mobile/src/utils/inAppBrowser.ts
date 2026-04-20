import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import type { SupabaseClient } from '@supabase/supabase-js';
import { buildAuthCallbackUrl } from '@meditime/utils';


// Utilise la variable d'env unifiée pour le callback auth mobile
const configuredAuthRedirectUrl = process.env.EXPO_PUBLIC_AUTH_REDIRECT_URL?.trim();
const configuredWebUrl = process.env.EXPO_PUBLIC_WEB_URL?.trim();

export const MOBILE_AUTH_CALLBACK_URL =
  configuredAuthRedirectUrl || Linking.createURL('auth/callback');

export function buildMobileAuthCallbackUrl(type?: string, redirect?: string) {
  try {
    const callbackUrl = new URL(MOBILE_AUTH_CALLBACK_URL);
    return buildAuthCallbackUrl(
      `${callbackUrl.protocol}//${callbackUrl.host}`,
      redirect,
      callbackUrl.pathname || '/auth/callback',
      type,
    );
  } catch {
    return buildAuthCallbackUrl(MOBILE_AUTH_CALLBACK_URL, redirect, '', type);
  }
}

export function buildWebResetPasswordCallbackUrl() {
  if (!configuredWebUrl) {
    throw new Error('Missing EXPO_PUBLIC_WEB_URL');
  }

  return buildAuthCallbackUrl(
    configuredWebUrl.replace(/\/+$/, ''),
    undefined,
    '/auth/callback',
    'recovery',
  );
}

WebBrowser.maybeCompleteAuthSession();

export function collectAuthCallbackParams(input: string | null | undefined) {
  const collected: Record<string, string | undefined> = {};
  if (!input) return collected;

  const pushParams = (raw: string) => {
    const params = new URLSearchParams(raw);
    params.forEach((value, key) => {
      collected[key] = value;
    });
  };

  const queryIndex = input.indexOf('?');
  const hashIndex = input.indexOf('#');

  if (queryIndex >= 0) {
    const end = hashIndex >= 0 && hashIndex > queryIndex ? hashIndex : input.length;
    pushParams(input.slice(queryIndex + 1, end));
  }

  if (hashIndex >= 0) {
    pushParams(input.slice(hashIndex + 1));
  }

  return collected;
}

export async function applySupabaseAuthCallback(
  supabase: SupabaseClient,
  callbackUrl: string,
) {
  const params = collectAuthCallbackParams(callbackUrl);
  await applySupabaseAuthParams(supabase, params);
}

export async function applySupabaseAuthParams(
  supabase: SupabaseClient,
  params: Record<string, string | undefined>,
) {
  const callbackError = params.error_description ?? params.error;
  if (callbackError) {
    throw new Error(callbackError);
  }

  if (params.code) {
    const { error } = await supabase.auth.exchangeCodeForSession(params.code);
    if (error) throw error;
    return;
  }

  if (params.access_token && params.refresh_token) {
    const { error } = await supabase.auth.setSession({
      access_token: params.access_token,
      refresh_token: params.refresh_token,
    });
    if (error) throw error;
  }
}

export async function openAuthUrlInApp(url: string) {
  const result = await WebBrowser.openAuthSessionAsync(
    url,
    MOBILE_AUTH_CALLBACK_URL,
    {
      dismissButtonStyle: 'close',
      presentationStyle: WebBrowser.WebBrowserPresentationStyle.FULL_SCREEN,
      showInRecents: false,
    },
  );

  return result.type === 'success' ? result.url : null;
}

export async function openUrlInApp(url: string) {
  await WebBrowser.openBrowserAsync(url, {
    dismissButtonStyle: 'close',
    presentationStyle: WebBrowser.WebBrowserPresentationStyle.FULL_SCREEN,
    showInRecents: false,
  });
}
