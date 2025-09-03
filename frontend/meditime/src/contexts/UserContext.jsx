import { createContext, useState, useEffect, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../services/supabase/supabaseClient';
import { log } from '../utils/logger';
import { 
  loginWithEmail, 
  registerWithEmail, 
  handleLogout, 
  resetPassword, 
  loginWithMagicLink,
  updateUserInfo as updateUserInfoService
} from '../services/auth/authService';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

const UserContext = createContext(null);
let globalReloadUser = () => {};

export const UserProvider = ({ children }) => {
  const [userInfo, setUserInfo] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const tokenRef = useRef(null);

  // Fonction pour charger les données utilisateur depuis AsyncStorage
  const loadUserFromStorage = useCallback(async () => {
    try {
      const storedUser = await AsyncStorage.getItem('userInfo');
      if (storedUser) {
        setUserInfo(JSON.parse(storedUser));
      }
    } catch (error) {
      log.error('Erreur lors du chargement des données utilisateur', { error });
    } finally {
      setIsInitialized(true);
    }
  }, []);

  // Fonction pour sauvegarder les données utilisateur dans AsyncStorage
  const saveUserToStorage = useCallback(async (user) => {
    try {
      if (user) {
        await AsyncStorage.setItem('userInfo', JSON.stringify(user));
      } else {
        await AsyncStorage.removeItem('userInfo');
      }
    } catch (error) {
      log.error('Erreur lors de la sauvegarde des données utilisateur', { error });
    }
  }, []);

  // Charger les données utilisateur au démarrage
  useEffect(() => {
    loadUserFromStorage();
  }, [loadUserFromStorage]);

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
          display_name: user.user_metadata?.name ?? null,
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
        await saveUserToStorage(userInfo);
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
      await saveUserToStorage(info);
    } catch (error) {
      log.error('[UserContext] Erreur lors de reloadUser', {
        error,
        origin: 'USER_SYNC_GET',
        code: 'USER_SYNC_ERROR',
      });
    }
  }, []);

  // Méthodes d'authentification utilisant authService
  const signIn = useCallback(async (email, password) => {
    const error = await loginWithEmail(email, password);
    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  }, []);

  const signUp = useCallback(async (email, password) => {
    const error = await registerWithEmail(email, password);
    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  }, []);

  const signOut = useCallback(async () => {
    try {
      await handleLogout();
      setUserInfo(null);
      await saveUserToStorage(null);
      tokenRef.current = null;
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }, [saveUserToStorage]);

  const sendPasswordReset = useCallback(async (email) => {
    try {
      await resetPassword(email);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }, []);

  const sendMagicLink = useCallback(async (email) => {
    const error = await loginWithMagicLink(email);
    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  }, []);

  const updateUserInfoWrapper = useCallback(async (userDataUpdate) => {
    if (!userInfo?.uid) return { success: false, error: 'Utilisateur non connecté' };
    
    return await updateUserInfoService({
      ...userDataUpdate,
      uid: userInfo.uid
    });
  }, [userInfo?.uid]);

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
          saveUserToStorage(null);
          tokenRef.current = null;
        }
      }
    );

    return () => listener?.subscription?.unsubscribe?.();
  }, [reloadUser]);

  return (
    <UserContext.Provider 
      value={{ 
        userInfo, 
        isInitialized,
        signIn,
        signUp,
        signOut,
        sendPasswordReset,
        sendMagicLink,
        updateUserInfo: updateUserInfoWrapper
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export { UserContext };
export const getGlobalReloadUser = () => globalReloadUser;
