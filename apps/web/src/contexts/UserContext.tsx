import { createContext, useState, useEffect, useCallback, useRef, type ReactNode } from 'react';
import { supabase } from '../services/supabase/supabaseClient';
import { log } from '@meditime/utils';
import type { UserContextValue, UserInfo } from '@meditime/types';

const API_URL = import.meta.env.VITE_API_URL;

type SessionLike = {
  access_token: string;
  user?: {
    id: string;
    email?: string | null;
    user_metadata?: Record<string, unknown>;
  } | null;
} | null;

type ReloadUserFn = (currentSession?: SessionLike) => Promise<void>;

const UserContext = createContext<UserContextValue | null>(null);
let globalReloadUser: ReloadUserFn = async () => {};

interface UserProviderProps {
  children: ReactNode;
}

function parseStoredUserInfo(): UserInfo | null {
  try {
    const raw = localStorage.getItem('userInfo');
    if (!raw) return null;
    return JSON.parse(raw) as UserInfo;
  } catch {
    return null;
  }
}

export function UserProvider({ children }: UserProviderProps) {
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
        const bodyBackend = {
          uid: user.id,
          display_name:
            (metadata.full_name as string | undefined) ??
            (metadata.name as string | undefined) ??
            null,
          email: user.email || null,
          photo_url: (metadata.avatar_url as string | undefined) ?? null,
          email_enabled: true,
          push_enabled: true,
        };

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

        const info: UserInfo = {
          displayName: (creationData.display_name as string | null | undefined) ?? null,
          email: (creationData.email as string | null | undefined) ?? null,
          photoUrl: (creationData.photo_url as string | null | undefined) ?? null,
          emailEnabled: Boolean(creationData.email_enabled),
          pushEnabled: Boolean(creationData.push_enabled),
          uid: user.id,
        };

        setUserInfo(info);
        localStorage.setItem('userInfo', JSON.stringify(info));
        return;
      }

      const data = (await res.json()) as Record<string, unknown>;
      if (!res.ok) {
        throw new Error((data.error as string | undefined) || 'Erreur chargement utilisateur');
      }

      const info: UserInfo = {
        displayName: (data.display_name as string | null | undefined) ?? null,
        email: (data.email as string | null | undefined) ?? null,
        photoUrl: (data.photo_url as string | null | undefined) ?? null,
        emailEnabled: Boolean(data.email_enabled),
        pushEnabled: Boolean(data.push_enabled),
        uid: user.id,
      };

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
