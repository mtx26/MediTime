import { useEffect, useState, useCallback } from 'react';
import { analyticsPromise } from '../../services/firebase/firebase';
import { log } from '../../utils/logger';
import { logEvent } from 'firebase/analytics';
import { supabase } from '../../services/supabase/supabaseClient';
import { useSupabaseRealtime } from './useSupabaseRealtime';

const API_URL = import.meta.env.VITE_API_URL;

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

    analyticsPromise.then((analytics) => {
      if (analytics) {
        logEvent(analytics, 'fetch_token_calendar_medicines', {
          count: data.medicines.length,
        });
      }
    });

    log.info(data.message, {
      origin: 'REALTIME_TOKEN_MEDICINES_SUCCESS',
      token,
      count: data.medicines.length,
    });
  } catch (err) {
    setLoadingMedicines(false);
    log.error(err.message, err, {
      origin: 'REALTIME_TOKEN_MEDICINES_FETCH_ERROR',
      token,
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
          origin: 'REALTIME_TOKEN_INIT_ERROR',
          token,
        });
      }
    };

    initListener();
  }, [token, setLoadingMedicines]);

  const fetchData = useCallback(() => {
    if (!token) return;
    return fetchTokenMedicines(token, setMedicinesData, setLoadingMedicines);
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
