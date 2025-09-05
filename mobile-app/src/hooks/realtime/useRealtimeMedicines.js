import { useEffect, useState, useCallback } from 'react';
import { log } from '../../utils/logger';
import { supabase } from '../../services/supabase/supabaseClient';
import { useSupabaseRealtime } from './useSupabaseRealtime';
import { API_URL } from '@env';

const fetchTokenMedicines = async (
  token,
  setMedicinesData,
  setLoadingMedicines
) => {
  try {
    const res = await fetch(`${API_URL}/api/tokens/${token}/medicines`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    const sorted = data.medicines.sort((a, b) => a.name.localeCompare(b.name));
    setMedicinesData(sorted);
    setLoadingMedicines(true);

    const [{ analyticsPromise }, { logEvent }] = await Promise.all([
      import('../../services/firebase/firebase'),
      import('firebase/analytics'),
    ]);
    analyticsPromise.then((analytics) => {
      if (analytics) {
        logEvent(analytics, 'fetch_token_calendar_medicines', {
          count: data.medicines.length,
        });
      }
    });

    log.info(data.message, {
      origin: 'REALTIME_TOKEN_MEDICINES',
      code: 'REALTIME_TOKEN_MEDICINES_SUCCESS',
      token,
      count: data.medicines.length,
    });
  } catch (err) {
    setLoadingMedicines(false);
    log.error(err.message, err, {
      origin: 'REALTIME_TOKEN_MEDICINES',
      token,
      code: 'REALTIME_TOKEN_MEDICINES_ERROR',
    });
  }
};

export const useRealtimeTokenMedicines = (
  token,
  setMedicinesData,
  setLoadingMedicines
) => {
  const [calendarId, setCalendarId] = useState(null);

  useEffect(() => {
    if (!token) return;

    const initListener = async () => {
      try {
        const res = await fetch(`${API_URL}/api/tokens/${token}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);

        if (!data.calendar_id) {
          throw new Error('calendar_id manquant dans le token');
        }

        setCalendarId(data.calendar_id);
      } catch (err) {
        setLoadingMedicines(false);
        log.error(err.message, err, {
          origin: 'TOKEN_METADATA_LOAD',
          code: 'TOKEN_METADATA_LOAD_ERROR',
          token,
        });
      }
    };

    initListener();
  }, [token, setLoadingMedicines]);

  const fetchData = useCallback(() => {
    if (!token) return;
    fetchTokenMedicines(token, setMedicinesData, setLoadingMedicines);
  }, [token, setMedicinesData, setLoadingMedicines]);

  useSupabaseRealtime({
    enabled: !!calendarId && !!token,
    fetchData,
    channels: [
      {
        channelName: `token-meds-${calendarId}`,
        table: 'medicines',
        filter: `calendar_id=eq.${calendarId}`,
      },
    ],
    deps: [token, calendarId],
  });
};
