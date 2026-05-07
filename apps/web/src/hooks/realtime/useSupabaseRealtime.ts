import { useEffect, useRef } from 'react';
import { supabase } from '../../services/supabase/supabaseClient';
import { log, subscribeRealtimeChannels, unsubscribeRealtimeChannels } from '@meditime/utils';
import type { RealtimeOptions, SubscribedChannel } from '@meditime/types';

export const useSupabaseRealtime = ({ enabled, fetchData, channels, deps = [] }: RealtimeOptions): void => {
  const channelRef = useRef<SubscribedChannel[]>([]);

  useEffect(() => {
    if (!enabled) return;

    void fetchData();

    channelRef.current = subscribeRealtimeChannels(
      supabase as Parameters<typeof subscribeRealtimeChannels>[0],
      channels,
      fetchData,
    );

    return () => {
      unsubscribeRealtimeChannels(channelRef.current, (err) => {
        log.error('Erreur lors de la désinscription des canaux Supabase', err, {
          origin: 'REALTIME_CLEANUP_ERROR',
        });
      });
      channelRef.current = [];
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, ...deps]);
};
