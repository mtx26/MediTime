import { useEffect, useRef } from 'react';
import { supabase } from '../../services/supabase/supabaseClient';
import { log } from '@meditime/utils';
import type { RealtimeChannelConfig } from '@meditime/types';

type RealtimeOptions = {
  enabled: boolean;
  fetchData: () => void | Promise<void>;
  channels: RealtimeChannelConfig[];
  deps?: ReadonlyArray<unknown>;
};

type SubscribedChannel = {
  unsubscribe: () => void;
};

export const useSupabaseRealtime = ({ enabled, fetchData, channels, deps = [] }: RealtimeOptions): void => {
  const channelRef = useRef<SubscribedChannel[]>([]);

  useEffect(() => {
    if (!enabled) return;

    void fetchData();

    channelRef.current = channels.map(({ channelName, event = '*', schema = 'public', table, filter }) => {
      const channel = (supabase.channel(channelName) as unknown as {
        on: (type: string, config: Record<string, unknown>, callback: () => void | Promise<void>) => {
          subscribe: () => SubscribedChannel;
        };
      })
        .on('postgres_changes', { event, schema, table, filter }, fetchData)
        .subscribe();

      return channel;
    });

    return () => {
      channelRef.current.forEach((ch) => {
        try {
          ch.unsubscribe();
        } catch (err) {
          log.error('Erreur lors de la désinscription des canaux Supabase', err, {
            origin: 'REALTIME_CLEANUP_ERROR',
          });
        }
      });
      channelRef.current = [];
    };
  }, [enabled, fetchData, channels, ...deps]);
};
