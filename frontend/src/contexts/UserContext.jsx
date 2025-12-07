import { createContext, useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../services/supabase/supabaseClient';
import { log } from '../utils/logger';

const API_URL = import.meta.env.VITE_API_URL;

const UserContext = createContext(null);
let globalReloadUser = () => {};

export const UserProvider = ({ children }) => {
  const [userInfo, setUserInfo] = useState(
    () => JSON.parse(localStorage.getItem('userInfo')) || null
  );
  const tokenRef = useRef(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      tokenRef.current = session?.access_token || null;
    });
  }, []);

  const reloadUser = useCallback(async (currentSession) => {
    let session = currentSession;
    let user = currentSession?.user;

    if (!session || !user) {
      const {
        data: { session: fetchedSession },
      } = await supabase.auth.getSession();
      const {
        data: { user: fetchedUser },
      } = await supabase.auth.getUser();
      session = fetchedSession;
      user = fetchedUser;
    }

    if (!user || !session) return;

    tokenRef.current = session.access_token;

    console.trace('[TRACE] reloadUser appelé');

    try {
      const res = await fetch(`${API_URL}/api/user/sync`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (res.status === 404) {
        const body_backend = {
          uid: user.id,
          display_name: user.user_metadata?.full_name ?? user.user_metadata?.name ?? null,
          email: user.email,
          photo_url: user.user_metadata?.avatar_url ?? null,
          email_enabled: true,
          push_enabled: true,
        };
        console.log('[UserContext] Utilisateur non trouvé, création en cours...');
        // Utilisateur non trouvé => première connexion
        const creationRes = await fetch(`${API_URL}/api/user/update`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify(body_backend),
        });

        const creationData = await creationRes.json();
        if (!creationRes.ok) throw new Error(creationData.error || 'Erreur création utilisateur');

        const userInfo = {
          displayName: creationData.display_name,
          email: creationData.email,
          photoUrl: creationData.photo_url,
          emailEnabled: creationData.email_enabled,
          pushEnabled: creationData.push_enabled,
          uid: user.id,
        };

        setUserInfo(userInfo);
        localStorage.setItem('userInfo', JSON.stringify(userInfo));
        return;
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur chargement utilisateur');

      const info = {
        displayName: data.display_name,
        email: data.email,
        photoUrl: data.photo_url,
        emailEnabled: data.email_enabled,
        pushEnabled: data.push_enabled,
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
    const { data: listener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'TOKEN_REFRESHED' && session) {
          if (tokenRef.current && tokenRef.current !== session.access_token) {
            log.info('[UserContext] Token mis à jour, appel reloadUser');
            reloadUser(session);
          }
        } else if (event === 'SIGNED_OUT') {
          setUserInfo(null);
          localStorage.removeItem('userInfo');
          tokenRef.current = null;
        }
      }
    );

    return () => listener?.subscription?.unsubscribe?.();
  }, [reloadUser]);

  return (
    <UserContext.Provider value={{ userInfo }}>{children}</UserContext.Provider>
  );
};

export { UserContext };
export const getGlobalReloadUser = () => globalReloadUser;
