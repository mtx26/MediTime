import { useContext, useCallback, type Dispatch, type SetStateAction } from 'react';
import { UserContext } from '../../contexts/UserContext';
import { supabase } from '../../services/supabase/supabaseClient';
import { log, getErrorMessage } from '@meditime/utils';
import { logAnalyticsEvent } from '../../services/firebase/logAnalyticsEvent';
import { useSupabaseRealtime } from './useSupabaseRealtime';
import type { LoadingStates, NotificationItem, NotificationsResponse, UserContextValue } from '@meditime/types';

const API_URL = import.meta.env.VITE_API_URL;

type SetNotificationsData = Dispatch<SetStateAction<NotificationItem[]>>;
type SetLoadingStates = Dispatch<SetStateAction<LoadingStates>>;


const fetchNotifications = async (
  uid: string,
  setNotificationsData: SetNotificationsData,
  setLoadingStates: SetLoadingStates
): Promise<void> => {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) throw new Error('Session Supabase non trouvée');

    const res = await fetch(`${API_URL}/api/notifications`, {
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    });

    const data = (await res.json()) as NotificationsResponse;
    if (!res.ok) throw new Error(data.error);

    const sortedNotifications = data.notifications.sort(
      (a: NotificationItem, b: NotificationItem) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    setNotificationsData(sortedNotifications);
    setLoadingStates((prev: LoadingStates) => ({ ...prev, notifications: false }));

    void logAnalyticsEvent('fetch_notifications', { uid, count: data.notifications?.length });

    log.info(data.message || 'Notifications synchronisees', {
      origin: 'REALTIME_NOTIFICATIONS_FETCH',
      uid,
      code: 'REALTIME_NOTIFICATIONS_FETCH_SUCCESS',
      count: data.notifications?.length,
    });
  } catch (err: unknown) {
    setNotificationsData([]);
    setLoadingStates((prev: LoadingStates) => ({ ...prev, notifications: false }));
    log.error(getErrorMessage(err, 'Échec de récupération des notifications'), err, {
      origin: 'REALTIME_NOTIFICATIONS_FETCH',
      uid,
      code: 'REALTIME_NOTIFICATIONS_FETCH_ERROR',
    });
  }
};

export const useRealtimeNotifications = (
  setNotificationsData: SetNotificationsData | null,
  setLoadingStates: SetLoadingStates
): void => {
  const userContext = useContext(UserContext) as UserContextValue | null;
  const userInfo = userContext?.userInfo;
  const uid = userInfo?.uid;

  const fetchData = useCallback(() => {
    if (!uid || !setNotificationsData) return;
    setLoadingStates((prev: LoadingStates) => ({ ...prev, notifications: true }));
    fetchNotifications(uid, setNotificationsData, setLoadingStates);
  }, [uid, setNotificationsData, setLoadingStates]);

  useSupabaseRealtime({
    enabled: !!uid && !!setNotificationsData,
    fetchData,
    channels: [
      {
        channelName: `notifications-${uid}`,
        table: 'notifications',
        filter: `user_id=eq.${uid}`,
      },
    ],
    deps: [uid],
  });
};
