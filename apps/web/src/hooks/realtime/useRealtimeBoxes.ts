import { useEffect, useContext, useCallback, type Dispatch, type SetStateAction } from 'react';
import { supabase } from '../../services/supabase/supabaseClient';
import { UserContext } from '../../contexts/UserContext';
import { log, getErrorMessage } from '@meditime/utils';
import { useSupabaseRealtime } from './useSupabaseRealtime';
import type { BoxItem, BoxesResponse, SourceType, UserContextValue } from '@meditime/types';

const API_URL = import.meta.env.VITE_API_URL;

type SetBoxes = Dispatch<SetStateAction<BoxItem[]>>;
type SetLoadingBoxes = Dispatch<SetStateAction<boolean | undefined>>;
type SetRep = Dispatch<SetStateAction<Response | null>>;

type FetchBoxesParams = {
  uid: string;
  calendarId: string;
  setBoxes: SetBoxes;
  setLoadingBoxes: SetLoadingBoxes;
  sourceType: SourceType;
  setRep: SetRep;
};


const fetchBoxes = async ({
  uid,
  calendarId,
  setBoxes,
  setLoadingBoxes,
  sourceType,
  setRep
}: FetchBoxesParams): Promise<void> => {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) throw new Error('Session Supabase non trouvée');

    const endpoint =
      sourceType === 'personal'
        ? `${API_URL}/api/calendars/${calendarId}/boxes`
        : `${API_URL}/api/shared/users/calendars/${calendarId}/boxes`;

    const res = await fetch(endpoint, {
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    });
    setRep(res);
    const data = (await res.json()) as BoxesResponse;
    if (!res.ok) throw new Error(data.error);

    const sorted = data.boxes.sort((a: BoxItem, b: BoxItem) => a.name.localeCompare(b.name));
    setBoxes(sorted);
    setLoadingBoxes(true);

    const eventName =
      sourceType === 'personal'
        ? 'fetch_personal_calendar_medicine_boxes'
        : 'fetch_shared_calendar_medicine_boxes';

    const logOrigin =
      sourceType === 'personal'
        ? 'REALTIME_PERSONAL_CALENDAR_BOXES'
        : 'REALTIME_SHARED_CALENDAR_BOXES';

    const [{ analyticsPromise }, { logEvent }] = await Promise.all([
      import('../../services/firebase/firebase'),
      import('firebase/analytics'),
    ]);
    void analyticsPromise.then((analytics: unknown) => {
      if (analytics) {
        (logEvent as (instance: unknown, name: string, params?: Record<string, unknown>) => void)(analytics, eventName, {
          uid,
          count: data.boxes.length,
          calendarId,
        });
      }
    });

    log.info(data.message || 'Boites synchronisees', {
      origin: logOrigin,
      uid,
      count: data.boxes.length,
      calendarId,
    });
  } catch (err: unknown) {
    const errorOrigin =
      sourceType === 'personal'
        ? 'PERSONAL_CALENDAR_MEDICINE_BOXES_FETCH_ERROR'
        : 'SHARED_CALENDAR_MEDICINE_BOXES_FETCH_ERROR';

    log.error(
      getErrorMessage(err, 'Erreur de récupération des boîtes de médicaments'),
      err,
      {
        origin: errorOrigin,
        calendarId,
      }
    );
  }
};

const useRealtimeBoxes = (
  sourceType: SourceType,
  calendarId: string | null,
  setBoxes: SetBoxes,
  setLoadingBoxes: SetLoadingBoxes,
  setRep: SetRep
): void => {
  const userContext = useContext(UserContext) as UserContextValue | null;
  const userInfo = userContext?.userInfo;

  useEffect(() => {
    if (!userInfo || !calendarId) {
      setLoadingBoxes(undefined);
    }
  }, [userInfo, calendarId, setLoadingBoxes]);

  const uid = userInfo?.uid;

  const fetchData = useCallback(() => {
    if (!uid || !calendarId) return;
    fetchBoxes({ uid, calendarId, setBoxes, setLoadingBoxes, sourceType, setRep });
  }, [uid, calendarId, setBoxes, setLoadingBoxes, sourceType, setRep]);

  const baseChannel =
    sourceType === 'personal' ? 'personal-meds' : 'shared-meds';
  const deleteChannel =
    sourceType === 'personal' ? 'delete-personal-meds' : 'delete-shared-meds';

  useSupabaseRealtime({
    enabled: !!uid && !!calendarId,
    fetchData,
    channels: [
      {
        channelName: `${baseChannel}-${calendarId}`,
        table: 'medicine_boxes',
        filter: `calendar_id=eq.${calendarId}`,
        event: '*',
      },
      {
        channelName: `${deleteChannel}-${calendarId}`,
        event: 'DELETE',
        table: 'medicine_boxes',
      },
    ],
    deps: [uid, calendarId, sourceType],
  });
};

export const useRealtimePersonalBoxes = (
  calendarId: string | null,
  setBoxes: SetBoxes,
  setLoadingBoxes: SetLoadingBoxes,
  setRep: SetRep
): void => {
  useRealtimeBoxes('personal', calendarId, setBoxes, setLoadingBoxes, setRep);
};

export const useRealtimeSharedBoxes = (
  calendarId: string | null,
  setBoxes: SetBoxes,
  setLoadingBoxes: SetLoadingBoxes,
  setRep: SetRep
): void => {
  useRealtimeBoxes('shared', calendarId, setBoxes, setLoadingBoxes, setRep);
};
