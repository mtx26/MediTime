import { createContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { supabase } from '../services/supabase';
import { log, mapApiResponseToUserInfo, buildUserCreationPayload, createAuthService } from '@meditime/utils';
import type { UserInfo, SessionLike, ReloadUserFn } from '@meditime/types';
import { buildMobileAuthCallbackUrl } from '../utils/inAppBrowser';

const API_URL = process.env.EXPO_PUBLIC_API_URL!;
const USER_SYNC_TIMEOUT_MS = 8000;

const authService = createAuthService(
  supabase,
  buildMobileAuthCallbackUrl,
);

export { authService };

export interface AuthContextValue {
  userInfo: UserInfo | null;
  isLoading: boolean;
  reloadUser: ReloadUserFn;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

function getLocalUserInfo(user: NonNullable<NonNullable<SessionLike>['user']>): UserInfo {
  const metadata = (user.user_metadata ?? {}) as Record<string, string | undefined>;

  return {
    uid: user.id,
    email: user.email ?? '',
    displayName: metadata.full_name ?? metadata.name ?? null,
    photoUrl: null,
    emailEnabled: true,
    pushEnabled: true,
  } as UserInfo;
}

async function fetchWithTimeout(input: RequestInfo | URL, init?: RequestInit) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), USER_SYNC_TIMEOUT_MS);

  try {
    return await fetch(input, {
      ...init,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeoutId);
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const reloadUser = useCallback<ReloadUserFn>(async (currentSession) => {
    let session = currentSession ?? null;

    if (!session) {
      const { data: { session: fetchedSession } } = await supabase.auth.getSession();
      session = fetchedSession as SessionLike;
    }

    const user = session?.user ?? null;

    if (!user || !session) {
      setUserInfo(null);
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetchWithTimeout(`${API_URL}/api/user/sync`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (res.status === 404) {
        const bodyBackend = buildUserCreationPayload(
          user.id,
          user.email ?? undefined,
          (user.user_metadata ?? {}) as Record<string, string | undefined>,
        );

        const creationRes = await fetchWithTimeout(`${API_URL}/api/user/update`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify(bodyBackend),
        });

        const creationData = (await creationRes.json()) as Record<string, unknown>;
        if (!creationRes.ok) {
          throw new Error((creationData.error as string | undefined) ?? 'Erreur création utilisateur');
        }

        setUserInfo(mapApiResponseToUserInfo(creationData, user.id));
        return;
      }

      const data = (await res.json()) as Record<string, unknown>;
      if (!res.ok) {
        throw new Error((data.error as string | undefined) ?? 'Erreur chargement utilisateur');
      }

      setUserInfo(mapApiResponseToUserInfo(data, user.id));
    } catch (error) {
      log.error('[AuthProvider] Erreur lors de reloadUser', {
        error,
        origin: 'USER_SYNC_GET',
        code: 'USER_SYNC_ERROR',
      });
      setUserInfo(getLocalUserInfo(user));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void reloadUser();

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        void reloadUser(session as SessionLike);
      } else if (event === 'SIGNED_OUT') {
        setUserInfo(null);
      }
    });

    return () => listener?.subscription?.unsubscribe?.();
  }, [reloadUser]);

  const signOut = useCallback(async () => {
    await authService.handleLogout();
  }, []);

  return (
    <AuthContext.Provider value={{ userInfo, isLoading, reloadUser, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
