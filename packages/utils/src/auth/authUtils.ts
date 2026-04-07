interface OAuthProviderOptions {
  scopes?: string;
  queryParams?: {
    prompt: string;
    access_type: string;
  };
}

const OAUTH_PROVIDER_OPTIONS: Record<string, OAuthProviderOptions> = {
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

export function buildAuthCallbackUrl(
  origin: string,
  redirect: string | null | undefined,
  callbackPath = '/auth/callback'
): string {
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
}: {
  display_name?: string | null;
  email?: string | null;
  photo_url?: string | null;
  email_enabled?: boolean | null;
  push_enabled?: boolean | null;
}): {
  display_name: string | null;
  email: string | null;
  photo_url: string | null;
  email_enabled: boolean | null;
  push_enabled: boolean | null;
} {
  return {
    display_name: display_name ?? null,
    email: email ?? null,
    photo_url: photo_url ?? null,
    email_enabled: email_enabled ?? null,
    push_enabled: push_enabled ?? null,
  };
}

export function getOAuthSignInOptions(provider: string, redirectTo: string): { redirectTo: string } & OAuthProviderOptions {
  const providerOptions = OAUTH_PROVIDER_OPTIONS[provider] ?? {};
  return {
    redirectTo,
    ...providerOptions,
  };
}
