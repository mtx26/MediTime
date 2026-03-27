const OAUTH_PROVIDER_OPTIONS = {
  google: {
    queryParams: {
      prompt: 'select_account',
      access_type: 'offline',
    },
  },
  github: {
    queryParams: {
      prompt: 'select_account',
      access_type: 'offline',
    },
  },
  twitter: {
    queryParams: {
      prompt: 'select_account',
      access_type: 'offline',
    },
  },
  facebook: {
    queryParams: {
      prompt: 'select_account',
      access_type: 'offline',
    },
  },
  discord: {
    queryParams: {
      prompt: 'select_account',
      access_type: 'offline',
    },
  },
  azure: {
    scopes: 'email profile openid',
    queryParams: {
      prompt: 'select_account',
      access_type: 'offline',
    },
  },
};

export function buildAuthCallbackUrl(origin, redirect, callbackPath = '/auth/callback') {
  return (
    origin +
    callbackPath +
    (redirect ? `?redirect=${encodeURIComponent(redirect)}` : '')
  );
}

export function buildUserUpdatePayload({
  display_name,
  email,
  photo_url,
  email_enabled,
  push_enabled,
}) {
  return {
    display_name: display_name ?? null,
    email: email ?? null,
    photo_url: photo_url ?? null,
    email_enabled: email_enabled ?? null,
    push_enabled: push_enabled ?? null,
  };
}

export function getOAuthSignInOptions(provider, redirectTo) {
  const providerOptions = OAUTH_PROVIDER_OPTIONS[provider] || {};
  return {
    redirectTo,
    ...providerOptions,
  };
}
