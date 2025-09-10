import { useContext, useCallback } from 'react';
import { UserContext } from '../../contexts/UserContext';
import { log } from '../../utils/logger';
import { useSupabaseRealtime } from './useSupabaseRealtime';
import { getToken } from '../../services/firebase/tokenUtils';

const API_URL = import.meta.env.VITE_API_URL;

const fetchNotifications = async (
  uid,
  setNotificationsData,
  setLoadingStates
) => {
  try {
    const token = await getToken();
    if (!token) throw new Error('Token Firebase non trouvé');

    const res = await fetch(`${API_URL}/api/notifications`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    const sortedNotifications = data.notifications.sort(
      (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
    );
    setNotificationsData(sortedNotifications);
    setLoadingStates((prev) => ({ ...prev, notifications: false }));

    const [{ analyticsPromise }, { logEvent }] = await Promise.all([
      import('../../services/firebase/firebase'),
      import('firebase/analytics'),
    ]);
    analyticsPromise.then((analytics) => {
      if (analytics) {
        logEvent(analytics, 'fetch_notifications', {
          uid,
          count: data.notifications?.length,
        });
      }
    });

    log.info(data.message, {
      origin: 'REALTIME_NOTIFICATIONS_FETCH',
      uid,
      code: 'REALTIME_NOTIFICATIONS_FETCH_SUCCESS',
      count: data.notifications?.length,
    });
  } catch (err) {
    setNotificationsData([]);
    setLoadingStates((prev) => ({ ...prev, notifications: false }));
    log.error(err.message || 'Échec de récupération des notifications', err, {
      origin: 'REALTIME_NOTIFICATIONS_FETCH',
      uid,
      code: 'REALTIME_NOTIFICATIONS_FETCH_ERROR',
    });
  }
};

export const useRealtimeNotifications = (
  setNotificationsData,
  setLoadingStates
) => {
  const { userInfo } = useContext(UserContext);
  const uid = userInfo?.uid;

  const fetchData = useCallback(() => {
    if (!uid) return;
    setLoadingStates((prev) => ({ ...prev, notifications: true }));
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
