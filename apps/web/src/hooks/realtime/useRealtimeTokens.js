import { useContext, useCallback } from 'react';
import { UserContext } from '../../contexts/UserContext';
import { log } from '@meditime/utils';
import { supabase } from '../../services/supabase/supabaseClient';
import { useSupabaseRealtime } from './useSupabaseRealtime';

const API_URL = import.meta.env.VITE_API_URL;

export const useRealtimeTokens = (setTokensList, setLoadingStates) => {
  const { userInfo } = useContext(UserContext);
  const uid = userInfo?.uid;

  const fetchTokens = useCallback(async () => {
    if (!uid) return;
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) throw new Error('Session Supabase non trouvée');

      const res = await fetch(`${API_URL}/api/tokens`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setTokensList(data.tokens);
      setLoadingStates((prev) => ({ ...prev, tokens: false }));

      const [{ analyticsPromise }, { logEvent }] = await Promise.all([
        import('../../services/firebase/firebase'),
        import('firebase/analytics'),
      ]);
      analyticsPromise.then((analytics) => {
        if (analytics) {
          logEvent(analytics, 'fetch_tokens', {
            uid,
            count: data.tokens?.length,
          });
        }
      });

      log.info(data.message, {
        origin: 'REALTIME_TOKENS_FETCH',
        code: 'REALTIME_TOKENS_FETCH_SUCCESS',
        uid,
        count: data.tokens.length,
      });
    } catch (err) {
      setLoadingStates((prev) => ({ ...prev, tokens: false }));
      log.error(err.message || 'Échec de récupération des tokens', err, {
        origin: 'REALTIME_TOKENS_FETCH',
        code: 'REALTIME_TOKENS_FETCH_ERROR',
        uid,
      });
    }
  }, [uid, setTokensList, setLoadingStates]);

  useSupabaseRealtime({
    enabled: !!uid && !!setTokensList,
    fetchData: fetchTokens,
    channels: [
      {
        channelName: `tokens-${uid}`,
        table: 'shared_tokens',
        filter: `owner_uid=eq.${uid}`,
      },
      {
        channelName: `delete-tokens-${uid}`,
        event: 'DELETE',
        table: 'shared_tokens',
      },
    ],
    deps: [uid],
  });
};
