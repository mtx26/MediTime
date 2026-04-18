import { useState, useCallback, useMemo, type Dispatch, type SetStateAction } from 'react';
import { fetchCalendars, fetchSharedCalendars } from '@meditime/utils';
import { log, getErrorMessage } from '@meditime/utils';
import { useSupabaseRealtime } from './useSupabaseRealtime';
import { useAuth } from '../auth/useAuth';
import type { CalendarItem } from '@meditime/types';

declare const process: { env: Record<string, string | undefined> };
const API_URL = process.env.EXPO_PUBLIC_API_URL ?? '';

type SetCalendarsData = Dispatch<SetStateAction<CalendarItem[] | null>>;
type SetLoadingStates = Dispatch<SetStateAction<{ calendars: boolean; sharedCalendars: boolean }>>;

const loadCalendars = async (
  uid: string,
  setCalendarsData: SetCalendarsData,
  setLoadingStates: SetLoadingStates,
): Promise<void> => {
  try {
    const calendars = await fetchCalendars(API_URL);
    setCalendarsData(calendars);
    setLoadingStates((prev) => ({ ...prev, calendars: false }));
    log.info('Calendriers synchronisés', {
      origin: 'REALTIME_CALENDAR_FETCH',
      uid,
      code: calendars.length ? 'REALTIME_CALENDAR_FETCH_SUCCESS' : 'REALTIME_CALENDAR_FETCH_EMPTY',
      count: calendars.length,
    });
  } catch (err) {
    setLoadingStates((prev) => ({ ...prev, calendars: false }));
    log.error(getErrorMessage(err, 'Échec de récupération des calendriers'), {
      origin: 'REALTIME_CALENDAR_FETCH',
      uid,
      code: 'REALTIME_CALENDAR_FETCH_ERROR',
    });
  }
};

const loadSharedCalendars = async (
  uid: string,
  setSharedCalendarsData: SetCalendarsData,
  setLoadingStates: SetLoadingStates,
): Promise<void> => {
  try {
    const calendars = await fetchSharedCalendars(API_URL);
    setSharedCalendarsData(calendars);
    setLoadingStates((prev) => ({ ...prev, sharedCalendars: false }));
    log.info('Calendriers partagés synchronisés', {
      origin: 'REALTIME_SHARED_CALENDARS_FETCH',
      uid,
      code: 'REALTIME_SHARED_CALENDARS_FETCH_SUCCESS',
      count: calendars.length,
    });
  } catch (err) {
    setLoadingStates((prev) => ({ ...prev, sharedCalendars: false }));
    log.error(getErrorMessage(err, 'Échec de récupération des calendriers partagés'), {
      origin: 'REALTIME_SHARED_CALENDARS_FETCH',
      uid,
      code: 'REALTIME_SHARED_CALENDARS_FETCH_ERROR',
    });
  }
};

export function useCalendars() {
  const { userInfo } = useAuth();
  const uid = (userInfo as { uid?: string } | null)?.uid;

  const [calendarsData, setCalendarsData] = useState<CalendarItem[] | null>(null);
  const [sharedCalendarsData, setSharedCalendarsData] = useState<CalendarItem[] | null>(null);
  const [loadingStates, setLoadingStates] = useState({ calendars: true, sharedCalendars: true });

  const calendarsIds = useMemo(() => {
    if (!calendarsData || calendarsData.length === 0) return '';
    return calendarsData.map((c) => c.id).join(',');
  }, [calendarsData]);

  const sharedCalendarsIds = useMemo(() => {
    if (!sharedCalendarsData || sharedCalendarsData.length === 0) return '';
    return sharedCalendarsData.map((c) => c.id).join(',');
  }, [sharedCalendarsData]);

  const fetchData = useCallback(() => {
    if (!uid) return;
    setLoadingStates((prev) => ({ ...prev, calendars: true }));
    void loadCalendars(uid, setCalendarsData, setLoadingStates);
  }, [uid]);

  const fetchSharedData = useCallback(() => {
    if (!uid) return;
    setLoadingStates((prev) => ({ ...prev, sharedCalendars: true }));
    void loadSharedCalendars(uid, setSharedCalendarsData, setLoadingStates);
  }, [uid]);

  useSupabaseRealtime({
    enabled: !!uid,
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
        channelName: 'medicine-boxes-insert-watch',
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

  useSupabaseRealtime({
    enabled: !!uid,
    fetchData: fetchSharedData,
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

  return {
    calendars: calendarsData ?? [],
    sharedCalendars: sharedCalendarsData ?? [],
    loading: loadingStates.calendars || loadingStates.sharedCalendars,
    reload: () => { fetchData(); fetchSharedData(); },
  };
}
