import { useContext, useCallback, useMemo, type Dispatch, type SetStateAction } from 'react';
import { supabase } from '../../services/supabase/supabaseClient';
import { log, getErrorMessage } from '@meditime/utils';
import { UserContext } from '../../contexts/UserContext';
import { useSupabaseRealtime } from './useSupabaseRealtime';
import type { CalendarItem, CalendarsResponse, LoadingStates, UserContextValue } from '@meditime/types';

const API_URL = import.meta.env.VITE_API_URL;

type SetUnknown = Dispatch<SetStateAction<unknown>>;
type SetLoadingStates = Dispatch<SetStateAction<LoadingStates>>;


const fetchCalendars = async (uid: string, setCalendarsData: SetUnknown, setLoadingStates: SetLoadingStates): Promise<void> => {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) throw new Error('Session Supabase non trouvée');

    const res = await fetch(`${API_URL}/api/calendars`, {
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    });

    const data = (await res.json()) as CalendarsResponse;
    if (!res.ok && res.status !== 404) throw new Error(data.error);

    const calendars = (data.calendars || []).sort((a: CalendarItem, b: CalendarItem) =>
      a.name.localeCompare(b.name)
    );

    setCalendarsData(calendars as unknown);
    setLoadingStates((prev: LoadingStates) => ({ ...prev, calendars: false }));

    const [{ analyticsPromise }, { logEvent }] = await Promise.all([
      import('../../services/firebase/firebase'),
      import('firebase/analytics'),
    ]);
    analyticsPromise.then((analytics: unknown) => {
      if (analytics) {
        (logEvent as (instance: unknown, name: string, params?: Record<string, unknown>) => void)(analytics, 'fetch_calendars', {
          uid,
          count: calendars.length,
        });
      }
    });

    log.info(data.message || 'Calendriers synchronises', {
      origin: 'REALTIME_CALENDAR_FETCH',
      uid,
      code: calendars.length
        ? 'REALTIME_CALENDAR_FETCH_SUCCESS'
        : 'REALTIME_CALENDAR_FETCH_EMPTY',
      count: calendars.length,
    });
  } catch (err: unknown) {
    setLoadingStates((prev: LoadingStates) => ({ ...prev, calendars: false }));
    log.error(getErrorMessage(err, 'Échec de récupération des calendriers'), {
      origin: 'REALTIME_CALENDAR_FETCH',
      uid,
      code: 'REALTIME_CALENDAR_FETCH_ERROR',
    });
  }
};

const fetchSharedCalendars = async (
  uid: string,
  setSharedCalendarsData: SetUnknown,
  setLoadingStates: SetLoadingStates
): Promise<void> => {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) throw new Error('Session Supabase non trouvée');

    const res = await fetch(`${API_URL}/api/shared/users/calendars`, {
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    });

    const data = (await res.json()) as CalendarsResponse;
    if (!res.ok) throw new Error(data.error);

    setSharedCalendarsData((data.calendars || []) as unknown);
    setLoadingStates((prev: LoadingStates) => ({ ...prev, sharedCalendars: false }));

    const [{ analyticsPromise }, { logEvent }] = await Promise.all([
      import('../../services/firebase/firebase'),
      import('firebase/analytics'),
    ]);
    analyticsPromise.then((analytics: unknown) => {
      if (analytics) {
        (logEvent as (instance: unknown, name: string, params?: Record<string, unknown>) => void)(analytics, 'fetch_shared_calendars', {
          uid,
          count: data.calendars?.length,
        });
      }
    });

    log.info(data.message || 'Calendriers partages synchronises', {
      origin: 'REALTIME_SHARED_CALENDARS_FETCH',
      code: 'REALTIME_SHARED_CALENDARS_FETCH_SUCCESS',
      uid,
      count: data.calendars?.length,
    });
  } catch (err: unknown) {
    setLoadingStates((prev: LoadingStates) => ({ ...prev, sharedCalendars: false }));
    log.error(getErrorMessage(err, 'Échec de récupération des calendriers partagés'), {
      origin: 'REALTIME_SHARED_CALENDARS_FETCH',
      code: 'REALTIME_SHARED_CALENDARS_FETCH_ERROR',
      uid,
    });
  }
};

export const useRealtimeCalendars = (
  setCalendarsData: SetUnknown,
  setLoadingStates: SetLoadingStates,
  calendarsData: Array<{ id: string }> = []
): void => {
  const userContext = useContext(UserContext) as UserContextValue | null;
  const userInfo = userContext?.userInfo;
  const uid = userInfo?.uid;

  const calendarsIds = useMemo(() => {
    if (!calendarsData || calendarsData.length === 0) return '';
    return calendarsData.map((calendar) => calendar.id).join(',');
  }, [calendarsData]);

  const fetchData = useCallback(() => {
    if (!uid) return;
    setLoadingStates((prev: LoadingStates) => ({ ...prev, calendars: true }));
    fetchCalendars(uid, setCalendarsData, setLoadingStates);
  }, [uid, setCalendarsData, setLoadingStates]);

  useSupabaseRealtime({
    enabled: !!uid && !!setCalendarsData,
    fetchData,
    channels: [
      {
        channelName: 'calendars-realtime',
        table: 'calendars',
        event: '*',
        filter: `owner_uid=eq.${uid}`,
      },
      {
        channelName: 'calendars-delete-watch',
        event: 'DELETE',
        table: 'calendars',
      },
      {
        channelName: `medicine-boxes-insert-watch`,
        table: 'medicine_boxes',
        event: '*',
        filter: `calendar_id=in.(${calendarsIds})`,
      },
      {
        channelName: 'medicine-boxes-delete-watch',
        event: 'DELETE',
        table: 'medicine_boxes',

      },
    ],
    deps: [uid, calendarsIds],
  });
};

export const useRealtimeSharedCalendars = (
  setSharedCalendarsData: SetUnknown,
  setLoadingStates: SetLoadingStates,
  sharedCalendarsData: Array<{ id: string }> = []
): void => {
  const userContext = useContext(UserContext) as UserContextValue | null;
  const userInfo = userContext?.userInfo;
  const uid = userInfo?.uid;

  const sharedCalendarsIds = useMemo(() => {
    if (!sharedCalendarsData || sharedCalendarsData.length === 0) return '';
    return sharedCalendarsData.map((sharedCalendar) => sharedCalendar.id).join(',');
  }, [sharedCalendarsData]);

  const fetchData = useCallback(() => {
    if (!uid) return;
    setLoadingStates((prev: LoadingStates) => ({ ...prev, sharedCalendars: true }));
    fetchSharedCalendars(uid, setSharedCalendarsData, setLoadingStates);
  }, [uid, setSharedCalendarsData, setLoadingStates]);

  useSupabaseRealtime({
    enabled: !!uid && !!setSharedCalendarsData,
    fetchData,
    channels: [
      {
        channelName: 'shared-calendars-realtime',
        table: 'shared_calendars',
        filter: `receiver_uid=eq.${uid}`,
      },
      {
        channelName: 'shared-calendars-delete-watch',
        event: 'DELETE',
        table: 'shared_calendars',
      },
      {
        channelName: 'shared-medicine-boxes-insert-watch',
        table: 'medicine_boxes',
        event: '*',
        filter: `calendar_id=in.(${sharedCalendarsIds})`,
      },
      {
        channelName: 'shared-medicine-boxes-delete-watch',
        event: 'DELETE',
        table: 'medicine_boxes',
      },
    ],
    deps: [uid, sharedCalendarsIds],
  });
};
