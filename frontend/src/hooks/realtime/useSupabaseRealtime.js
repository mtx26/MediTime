import { useEffect, useRef } from 'react';
import { supabase } from '../../services/supabase/supabaseClient';
import { log } from '../../utils/logger';

/**
 * Standardized supabase realtime subscription hook.
 * @param {Object} options
 * @param {boolean} options.enabled - If false, no subscription is created.
 * @param {Function} options.fetchData - Function called initially and on every event.
 * @param {Array} options.channels - Array of channel configs
 *   ({ channelName, event='*', schema='public', table, filter }).
 * @param {Array} [options.deps] - Additional dependencies for the effect.
 */
export const useSupabaseRealtime = ({
  enabled,
  fetchData,
  channels,
  deps = [],
}) => {
  const channelRef = useRef([]);

  useEffect(() => {
    if (!enabled) return;

    fetchData();

    channelRef.current = channels.map(
      ({ channelName, event = '*', schema = 'public', table, filter }) =>
        supabase
          .channel(channelName)
          .on('postgres_changes', { event, schema, table, filter }, fetchData)
          .subscribe()
    );

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
  }, [enabled, ...deps]);
};
