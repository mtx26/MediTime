import { useContext, useCallback } from 'react';
import { supabase } from '../../services/supabase/supabaseClient';
import { log } from '../../utils/logger';
import { UserContext } from '../../contexts/UserContext';
import { useSupabaseRealtime } from './useSupabaseRealtime';

const API_URL = import.meta.env.VITE_API_URL;

const fetchCalendars = async (uid, setCalendarsData, setLoadingStates) => {
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

    const data = await res.json();
    if (!res.ok && res.status !== 404) throw new Error(data.error);

    const calendars = (data.calendars || []).sort((a, b) =>
      a.name.localeCompare(b.name)
    );

    setCalendarsData(calendars);
    setLoadingStates((prev) => ({ ...prev, calendars: false }));

    const [{ analyticsPromise }, { logEvent }] = await Promise.all([
      import('../../services/firebase/firebase'),
      import('firebase/analytics'),
    ]);
    analyticsPromise.then((analytics) => {
      if (analytics) {
        logEvent(analytics, 'fetch_calendars', {
          uid,
          count: calendars.length,
        });
      }
    });

    log.info(data.message, {
      origin: 'REALTIME_CALENDAR_FETCH',
      uid,
      code: calendars.length
        ? 'REALTIME_CALENDAR_FETCH_SUCCESS'
        : 'REALTIME_CALENDAR_FETCH_EMPTY',
      count: calendars.length,
    });
  } catch (err) {
    setLoadingStates((prev) => ({ ...prev, calendars: false }));
    log.error(err.message || 'Échec de récupération des calendriers', {
      origin: 'REALTIME_CALENDAR_FETCH',
      uid,
      code: 'REALTIME_CALENDAR_FETCH_ERROR',
    });
  }
};

const fetchSharedCalendars = async (
  uid,
  setSharedCalendarsData,
  setLoadingStates
) => {
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

    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    setSharedCalendarsData(data.calendars);
    setLoadingStates((prev) => ({ ...prev, sharedCalendars: false }));

    const [{ analyticsPromise }, { logEvent }] = await Promise.all([
      import('../../services/firebase/firebase'),
      import('firebase/analytics'),
    ]);
    analyticsPromise.then((analytics) => {
      if (analytics) {
        logEvent(analytics, 'fetch_shared_calendars', {
          uid,
          count: data.calendars?.length,
        });
      }
    });

    log.info(data.message, {
      origin: 'REALTIME_SHARED_CALENDARS_FETCH',
      code: 'REALTIME_SHARED_CALENDARS_FETCH_SUCCESS',
      uid,
      count: data.calendars?.length,
    });
  } catch (err) {
    setLoadingStates((prev) => ({ ...prev, sharedCalendars: false }));
    log.error(err.message || 'Échec de récupération des calendriers partagés', {
      origin: 'REALTIME_SHARED_CALENDARS_FETCH',
      code: 'REALTIME_SHARED_CALENDARS_FETCH_ERROR',
      uid,
    });
  }
};

export const useRealtimeCalendars = (setCalendarsData, setLoadingStates) => {
  const { userInfo } = useContext(UserContext);
  const uid = userInfo?.uid;

  const fetchData = useCallback(() => {
    if (!uid) return;
    setLoadingStates((prev) => ({ ...prev, calendars: true }));
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
    ],
    deps: [uid],
  });
};

export const useRealtimeSharedCalendars = (
  setSharedCalendarsData,
  setLoadingStates
) => {
  const { userInfo } = useContext(UserContext);
  const uid = userInfo?.uid;

  const fetchData = useCallback(() => {
    if (!uid) return;
    setLoadingStates((prev) => ({ ...prev, sharedCalendars: true }));
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
    ],
    deps: [uid],
  });
};
