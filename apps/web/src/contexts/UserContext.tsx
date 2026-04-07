import { createContext, useState, useEffect, useCallback, useRef, type ReactNode } from 'react';
import { supabase } from '../services/supabase/supabaseClient';
import { log, mapApiResponseToUserInfo, buildUserCreationPayload } from '@meditime/utils';
import type { UserContextValue, UserInfo, SessionLike, ReloadUserFn, UserProviderProps } from '@meditime/types';

const API_URL = import.meta.env.VITE_API_URL;

const UserContext = createContext<UserContextValue | null>(null);
let globalReloadUser: ReloadUserFn = async () => {};

function parseStoredUserInfo(): UserInfo | null {
  try {
    const raw = localStorage.getItem('userInfo');
    if (!raw) return null;
    return JSON.parse(raw) as UserInfo;
  } catch {
    return null;
  }
}

export function UserProvider({ children }: UserProviderProps<ReactNode>) {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(() => parseStoredUserInfo());
  const [recoveryEvent, setRecoveryEvent] = useState(false);
  const tokenRef = useRef<string | null>(null);

  useEffect(() => {
    void supabase.auth.getSession().then(({ data: { session } }) => {
      tokenRef.current = session?.access_token || null;
    });
  }, []);

  const reloadUser = useCallback<ReloadUserFn>(async (currentSession) => {
    let session = currentSession;
    let user = currentSession?.user || null;

    if (!session || !user) {
      const {
        data: { session: fetchedSession },
      } = await supabase.auth.getSession();
      const {
        data: { user: fetchedUser },
      } = await supabase.auth.getUser();
      session = fetchedSession as SessionLike;
      user = fetchedUser as SessionLike extends { user?: infer U } ? U : never;
    }

    if (!user || !session) return;

    tokenRef.current = session.access_token;

    try {
      const res = await fetch(`${API_URL}/api/user/sync`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (res.status === 404) {
        const metadata = user.user_metadata || {};
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
          throw new Error((creationData.error as string | undefined) || 'Erreur création utilisateur');
        }

        const info: UserInfo = mapApiResponseToUserInfo(creationData, user.id);

        setUserInfo(info);
        localStorage.setItem('userInfo', JSON.stringify(info));
        return;
      }

      const data = (await res.json()) as Record<string, unknown>;
      if (!res.ok) {
        throw new Error((data.error as string | undefined) || 'Erreur chargement utilisateur');
      }

      const info: UserInfo = mapApiResponseToUserInfo(data, user.id);

      setUserInfo(info);
      localStorage.setItem('userInfo', JSON.stringify(info));
    } catch (error) {
      log.error('[UserContext] Erreur lors de reloadUser', {
        error,
        origin: 'USER_SYNC_GET',
        code: 'USER_SYNC_ERROR',
      });
    }
  }, []);

  useEffect(() => {
    globalReloadUser = reloadUser;
  }, [reloadUser]);

  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setRecoveryEvent(true);
      }

      if (event === 'TOKEN_REFRESHED' && session) {
        if (tokenRef.current && tokenRef.current !== session.access_token) {
          log.info('[UserContext] Token mis à jour, appel reloadUser');
          void reloadUser(session as SessionLike);
        }
      } else if (event === 'SIGNED_OUT') {
        setUserInfo(null);
        localStorage.removeItem('userInfo');
        tokenRef.current = null;
        setRecoveryEvent(false);
      }
    });

    return () => listener?.subscription?.unsubscribe?.();
  }, [reloadUser]);

  return <UserContext.Provider value={{ userInfo, recoveryEvent }}>{children}</UserContext.Provider>;
}

export { UserContext };
export const getGlobalReloadUser = (): ReloadUserFn => globalReloadUser;
