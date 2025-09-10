import { createContext, useState, useEffect, useCallback, useRef } from 'react';
import { auth } from '../services/firebase/firebase';
import { onIdTokenChanged } from 'firebase/auth';
import { log } from '../utils/logger';
import {
  syncSupabaseAuth,
  clearSupabaseAuth,
} from '../services/supabase/tokenUtils';

const API_URL = import.meta.env.VITE_API_URL;

const UserContext = createContext(null);
let globalReloadUser = () => {};

export const UserProvider = ({ children }) => {
  const [userInfo, setUserInfo] = useState(
    () => JSON.parse(localStorage.getItem('userInfo')) || null
  );
  const tokenRef = useRef(null);

  const reloadUser = useCallback(async (currentUser) => {
    const user = currentUser || auth.currentUser;
    if (!user) return;

    const token = await user.getIdToken();
    tokenRef.current = token;
    await syncSupabaseAuth(token);

    try {
      const res = await fetch(`${API_URL}/api/user/sync`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.status === 404) {
        const body_backend = {
          uid: user.uid,
          display_name: user.displayName ?? null,
          email: user.email,
          photo_url: user.photoURL ?? null,
          email_enabled: true,
          push_enabled: true,
        };
        const creationRes = await fetch(`${API_URL}/api/user/update`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(body_backend),
        });
        const creationData = await creationRes.json();
        if (!creationRes.ok)
          throw new Error(creationData.error || 'Erreur création utilisateur');

        const info = {
          displayName: creationData.display_name,
          email: creationData.email,
          photoUrl: creationData.photo_url,
          emailEnabled: creationData.email_enabled,
          pushEnabled: creationData.push_enabled,
          uid: user.uid,
        };
        setUserInfo(info);
        localStorage.setItem('userInfo', JSON.stringify(info));
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
        uid: user.uid,
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
    const unsubscribe = onIdTokenChanged(auth, async (user) => {
      if (user) {
        const token = await user.getIdToken();
        if (tokenRef.current !== token) {
          tokenRef.current = token;
          reloadUser(user);
        }
      } else {
        setUserInfo(null);
        localStorage.removeItem('userInfo');
        tokenRef.current = null;
        await clearSupabaseAuth();
      }
    });
    return () => unsubscribe();
  }, [reloadUser]);

  return (
    <UserContext.Provider value={{ userInfo }}>{children}</UserContext.Provider>
  );
};

export { UserContext };
export const getGlobalReloadUser = () => globalReloadUser;
