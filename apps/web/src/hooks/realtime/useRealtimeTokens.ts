import { useContext, useCallback, type Dispatch, type SetStateAction } from 'react';
import { UserContext } from '../../contexts/UserContext';
import { log, getErrorMessage } from '@meditime/utils';
import { supabase } from '../../services/supabase/supabaseClient';
import { logAnalyticsEvent } from '../../services/firebase/logAnalyticsEvent';
import { useSupabaseRealtime } from './useSupabaseRealtime';
import type { LoadingStates, TokenItem, TokensResponse, UserContextValue } from '@meditime/types';

const API_URL = import.meta.env.VITE_API_URL;


export const useRealtimeTokens = (
  setTokensList: Dispatch<SetStateAction<TokenItem[]>> | null,
  setLoadingStates: Dispatch<SetStateAction<LoadingStates>>
): void => {
  const userContext = useContext(UserContext) as UserContextValue | null;
  const userInfo = userContext?.userInfo;
  const uid = userInfo?.uid;

  const fetchTokens = useCallback(async () => {
    if (!uid || !setTokensList) return;
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) throw new Error('Session Supabase non trouvée');

      const res = await fetch(`${API_URL}/api/tokens`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      const data = (await res.json()) as TokensResponse;
      if (!res.ok) throw new Error(data.error);

      setTokensList(data.tokens);
      setLoadingStates((prev: LoadingStates) => ({ ...prev, tokens: false }));

      void logAnalyticsEvent('fetch_tokens', { uid, count: data.tokens?.length });

      log.info(data.message || 'Tokens synchronises', {
        origin: 'REALTIME_TOKENS_FETCH',
        code: 'REALTIME_TOKENS_FETCH_SUCCESS',
        uid,
        count: data.tokens.length,
      });
    } catch (err: unknown) {
      setLoadingStates((prev: LoadingStates) => ({ ...prev, tokens: false }));
      log.error(getErrorMessage(err, 'Échec de récupération des tokens'), err, {
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
