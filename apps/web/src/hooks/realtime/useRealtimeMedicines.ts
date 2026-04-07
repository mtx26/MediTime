import { useEffect, useState, useCallback, type Dispatch, type SetStateAction } from 'react';
import { log, getErrorMessage } from '@meditime/utils';
import { logAnalyticsEvent } from '../../services/firebase/logAnalyticsEvent';
import { useSupabaseRealtime } from './useSupabaseRealtime';
import type { MedicineItem, MedicinesResponse } from '@meditime/types';

const API_URL = import.meta.env.VITE_API_URL;

type SetMedicinesData = Dispatch<SetStateAction<MedicineItem[]>>;
type SetLoadingMedicines = Dispatch<SetStateAction<boolean>>;


const fetchTokenMedicines = async (
  token: string,
  setMedicinesData: SetMedicinesData,
  setLoadingMedicines: SetLoadingMedicines
): Promise<void> => {
  try {
    const res = await fetch(`${API_URL}/api/tokens/${token}/medicines`);
    const data = (await res.json()) as MedicinesResponse;
    if (!res.ok) throw new Error(data.error);

    const sorted = data.medicines.sort((a: MedicineItem, b: MedicineItem) => a.name.localeCompare(b.name));
    setMedicinesData(sorted);
    setLoadingMedicines(true);

    void logAnalyticsEvent('fetch_token_calendar_medicines', { count: data.medicines.length });

    log.info(data.message || 'Medicaments synchronises', {
      origin: 'REALTIME_TOKEN_MEDICINES',
      code: 'REALTIME_TOKEN_MEDICINES_SUCCESS',
      token,
      count: data.medicines.length,
    });
  } catch (err: unknown) {
    setLoadingMedicines(false);
    log.error(getErrorMessage(err, 'Erreur de récupération des médicaments'), err, {
      origin: 'REALTIME_TOKEN_MEDICINES',
      token,
      code: 'REALTIME_TOKEN_MEDICINES_ERROR',
    });
  }
};

export const useRealtimeTokenMedicines = (
  token: string | null,
  setMedicinesData: SetMedicinesData,
  setLoadingMedicines: SetLoadingMedicines
): void => {
  const [calendarId, setCalendarId] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;

    const initListener = async () => {
      try {
        const res = await fetch(`${API_URL}/api/tokens/${token}`);
        const data = (await res.json()) as MedicinesResponse;
        if (!res.ok) throw new Error(data.error);

        if (!data.calendar_id) {
          throw new Error('calendar_id manquant dans le token');
        }

        setCalendarId(data.calendar_id);
      } catch (err: unknown) {
        setLoadingMedicines(false);
        log.error(getErrorMessage(err, 'Erreur de récupération du token'), err, {
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
