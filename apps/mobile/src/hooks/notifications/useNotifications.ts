import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import {
  buildNotificationActions,
  createNotificationsApi,
  performApiCall,
} from '@meditime/utils';
import type {
  NotificationItem,
  NotificationsResponse,
} from '@meditime/types';
import { useAuth } from '../auth/useAuth';
import { supabase } from '../../services/supabase';
import { toActionSheetItems, toMobileHref } from '../../utils';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? '';

function sortNotifications(notifications: NotificationItem[]) {
  return [...notifications].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );
}

export function useNotifications() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { userInfo, isLoading: isAuthLoading } = useAuth();
  const [notificationsData, setNotificationsData] = useState<NotificationItem[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const apiOptions = useMemo(
    () => ({
      apiUrl: API_URL,
      uid: userInfo?.uid ?? null,
      showAlert: null,
      performApiCall,
    }),
    [userInfo?.uid],
  );

  const notificationsApi = useMemo(
    () => createNotificationsApi(apiOptions),
    [apiOptions],
  );

  const loadNotifications = useCallback(async (mode: 'initial' | 'refresh' = 'initial') => {
    if (!userInfo?.uid) {
      setNotificationsData([]);
      setError(null);
      setIsLoading(false);
      setIsRefreshing(false);
      return;
    }

    if (!API_URL) {
      setNotificationsData([]);
      setError('API URL missing');
      setIsLoading(false);
      setIsRefreshing(false);
      return;
    }

    if (mode === 'refresh') {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error(String(t('api.notifications.fetch_error')));
      }

      const response = await fetch(`${API_URL}/api/notifications`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      const data = (await response.json()) as NotificationsResponse;

      if (!response.ok) {
        throw new Error(data.error ?? String(t('api.notifications.fetch_error')));
      }

      setNotificationsData(sortNotifications(data.notifications ?? []));
      setError(null);
    } catch (fetchError) {
      setNotificationsData([]);
      setError(
        fetchError instanceof Error
          ? fetchError.message
          : String(t('api.notifications.fetch_error')),
      );
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [t, userInfo?.uid]);

  useEffect(() => {
    if (isAuthLoading) return;
    void loadNotifications();
  }, [isAuthLoading, loadNotifications]);

  const navigateToHref = useCallback((href: string) => {
    router.push(toMobileHref(href) as never);
  }, [router]);

  const readNotification = useCallback((notificationId: string) => {
    setNotificationsData((current) => current?.map((item) => (
      item.notification_id === notificationId
        ? { ...item, read: true }
        : item
    )) ?? current);

    void notificationsApi.readNotification(notificationId).then((result) => {
      if (!result.success) {
        void loadNotifications();
      }
    });
  }, [loadNotifications, notificationsApi]);

  const readAllNotifications = useCallback(() => {
    const hasUnread = notificationsData?.some((item) => !item.read) ?? false;
    if (!hasUnread) return;

    setNotificationsData((current) => current?.map((item) => ({ ...item, read: true })) ?? current);

    void notificationsApi.readAllNotifications().then((result) => {
      if (!result.success) {
        void loadNotifications();
      }
    });
  }, [loadNotifications, notificationsApi, notificationsData]);

  const translate = useCallback((key: string) => String(t(key)), [t]);
  const lng = (i18n.language || 'fr').slice(0, 2);

  const actions = useMemo(() => toActionSheetItems(
    buildNotificationActions(
      { lng },
      {
        onMarkAllRead: readAllNotifications,
      },
    ),
    translate,
  ), [lng, readAllNotifications, translate]);

  return {
    userInfo,
    isAuthLoading,
    notificationsData,
    isLoading,
    isRefreshing,
    error,
    actions,
    navigateToHref,
    loadNotifications,
    readNotification,
    readAllNotifications,
  };
}
