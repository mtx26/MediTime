import { createContext, useState, useEffect, useCallback, useRef, type ReactNode } from 'react';
import { supabase } from '../services/supabase';
import { log, mapApiResponseToUserInfo, buildUserCreationPayload, createAuthService } from '@meditime/utils';
import type { UserInfo, SessionLike, ReloadUserFn } from '@meditime/types';

const API_URL = process.env.EXPO_PUBLIC_API_URL!;

const authService = createAuthService(
  supabase,
  (_redirect?: string) => 'meditime://auth/callback',
);

export { authService };

export interface AuthContextValue {
  userInfo: UserInfo | null;
  isLoading: boolean;
  reloadUser: ReloadUserFn;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const tokenRef = useRef<string | null>(null);

  const reloadUser = useCallback<ReloadUserFn>(async (currentSession) => {
    let session = currentSession;
    let user = currentSession?.user ?? null;

    if (!session || !user) {
      const { data: { session: fetchedSession } } = await supabase.auth.getSession();
      const { data: { user: fetchedUser } } = await supabase.auth.getUser();
      session = fetchedSession as SessionLike;
      user = fetchedUser as SessionLike extends { user?: infer U } ? U : never;
    }

    if (!user || !session) {
      setUserInfo(null);
      setIsLoading(false);
      return;
    }

    tokenRef.current = session.access_token;

    try {
      const res = await fetch(`${API_URL}/api/user/sync`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (res.status === 404) {
        const metadata = (user.user_metadata ?? {}) as Record<string, string | undefined>;
        const bodyBackend = buildUserCreationPayload(user.id, user.email ?? undefined, metadata);

        const creationRes = await fetch(`${API_URL}/api/user/update`, {
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
      const metadata = (user.user_metadata ?? {}) as Record<string, string | undefined>;
      setUserInfo({
        uid: user.id,
        email: user.email ?? '',
        displayName: metadata.full_name ?? metadata.name ?? null,
        photoUrl: null,
        emailEnabled: true,
        pushEnabled: true,
      } as UserInfo);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void reloadUser();

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        void reloadUser(session as SessionLike);
      } else if (event === 'TOKEN_REFRESHED' && session) {
        if (tokenRef.current && tokenRef.current !== session.access_token) {
          void reloadUser(session as SessionLike);
        }
      } else if (event === 'SIGNED_OUT') {
        setUserInfo(null);
        tokenRef.current = null;
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
