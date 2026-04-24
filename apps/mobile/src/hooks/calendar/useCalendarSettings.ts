import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { CALENDAR_SETTINGS_TABS } from '@meditime/constants';
import { getFirstRouteParam } from '@meditime/utils';
import type {
  ApiResult,
  CalendarSettingsTab,
  NotificationSettingResult,
  StockMethodResult,
  StockDecrementMethod,
} from '@meditime/types';
import { useCalendarApis } from './useCalendarApis';
import { dismissToCalendars } from './navigation';

type EditableCalendarSourceType = 'personal' | 'sharedUser';

type NotificationsSource = {
  fetchNotificationsEnabled: (calendarId: string) => Promise<ApiResult>;
  updateNotificationsEnabled: (calendarId: string) => Promise<ApiResult>;
};

type StockSource = {
  fetchStockDecrementMethod: (calendarId: string) => Promise<ApiResult>;
  updateStockDecrementMethod: (calendarId: string, method: StockDecrementMethod) => Promise<ApiResult>;
};

function isCalendarSettingsTab(value: string | null | undefined): value is CalendarSettingsTab {
  return value === CALENDAR_SETTINGS_TABS.STOCK || value === CALENDAR_SETTINGS_TABS.NOTIFICATIONS;
}

export function useCalendarSettings(sourceType: EditableCalendarSourceType) {
  const { calendarId, tab } = useLocalSearchParams<{ calendarId?: string; tab?: string | string[] }>();
  const { t } = useTranslation();
  const router = useRouter();
  const { personalCalendarsApi, sharedUserCalendarsApi } = useCalendarApis();
  const [activeTab, setActiveTabState] = useState<CalendarSettingsTab>(
    sourceType === 'personal' ? CALENDAR_SETTINGS_TABS.STOCK : CALENDAR_SETTINGS_TABS.NOTIFICATIONS,
  );
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [stockMethod, setStockMethod] = useState<StockDecrementMethod | ''>('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const notificationsSource: NotificationsSource = useMemo(
    () => sourceType === 'personal'
      ? {
          fetchNotificationsEnabled: personalCalendarsApi.fetchPersonalNotificationsEnabled,
          updateNotificationsEnabled: personalCalendarsApi.updatePersonalNotificationsEnabled,
        }
      : {
          fetchNotificationsEnabled: sharedUserCalendarsApi.fetchSharedUserNotificationsEnabled,
          updateNotificationsEnabled: sharedUserCalendarsApi.updateSharedUserNotificationsEnabled,
        },
    [personalCalendarsApi, sharedUserCalendarsApi, sourceType],
  );

  const stockSource: StockSource | null = useMemo(
    () => sourceType === 'personal'
      ? {
          fetchStockDecrementMethod: personalCalendarsApi.fetchPersonalStockDecrementMethod,
          updateStockDecrementMethod: personalCalendarsApi.updatePersonalStockDecrementMethod,
        }
      : null,
    [personalCalendarsApi, sourceType],
  );

  useEffect(() => {
    const rawTab = getFirstRouteParam(tab);
    if (isCalendarSettingsTab(rawTab)) {
      if (sourceType === 'sharedUser' && rawTab === CALENDAR_SETTINGS_TABS.STOCK) {
        setActiveTabState(CALENDAR_SETTINGS_TABS.NOTIFICATIONS);
        return;
      }

      setActiveTabState(rawTab);
      return;
    }

    setActiveTabState(sourceType === 'personal' ? CALENDAR_SETTINGS_TABS.STOCK : CALENDAR_SETTINGS_TABS.NOTIFICATIONS);
  }, [sourceType, tab]);

  const fetchSettingsSnapshot = useCallback(async () => {
    if (!calendarId) return null;

    const requests: Promise<ApiResult>[] = [notificationsSource.fetchNotificationsEnabled(calendarId)];
    if (stockSource) {
      requests.unshift(stockSource.fetchStockDecrementMethod(calendarId));
    }

    return Promise.all(requests);
  }, [calendarId, notificationsSource, stockSource]);

  const applySettingsSnapshot = useCallback((results: ApiResult[]) => {
    const hasNotFound = results.some((result) => result.status === 404);
    if (hasNotFound) {
      setNotFound(true);
      return false;
    }

    if (stockSource) {
      const stockResult = results[0] as StockMethodResult;
      const notificationsResult = results[1] as NotificationSettingResult;

      if (!stockResult.success) {
        setError(stockResult.error ?? String(t('calendar_settings.loading_stock_settings')));
        return false;
      }

      if (!notificationsResult.success) {
        setError(notificationsResult.error ?? String(t('calendar_settings.loading_notification_settings')));
        return false;
      }

      setStockMethod(stockResult.method ?? '');
      setNotificationsEnabled(Boolean(notificationsResult['notifications-enabled']));
      setNotFound(false);
      return true;
    }

    const notificationsResult = results[0] as NotificationSettingResult;
    if (!notificationsResult.success) {
      setError(notificationsResult.error ?? String(t('calendar_settings.loading_notification_settings')));
      return false;
    }

    setNotificationsEnabled(Boolean(notificationsResult['notifications-enabled']));
    setNotFound(false);
    return true;
  }, [stockSource, t]);

  const syncSettingsSilently = useCallback(async () => {
    try {
      const results = await fetchSettingsSnapshot();
      if (!results) return;
      setError(null);
      applySettingsSnapshot(results);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(t('error')));
    }
  }, [applySettingsSnapshot, fetchSettingsSnapshot, t]);

  const loadSettings = useCallback(async (mode: 'initial' | 'refresh' = 'initial') => {
    if (!calendarId) {
      setLoading(false);
      setRefreshing(false);
      return;
    }

    if (mode === 'refresh') {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const results = await fetchSettingsSnapshot();
      if (!results) return;
      applySettingsSnapshot(results);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(t('error')));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [applySettingsSnapshot, calendarId, fetchSettingsSnapshot, t]);

  useFocusEffect(
    useCallback(() => {
      void loadSettings();
    }, [loadSettings]),
  );

  const setActiveTab = (nextTab: CalendarSettingsTab) => {
    const resolvedTab = sourceType === 'sharedUser' ? CALENDAR_SETTINGS_TABS.NOTIFICATIONS : nextTab;
    setActiveTabState(resolvedTab);
    router.setParams({ tab: resolvedTab });
  };

  const toggleNotifications = async () => {
    if (!calendarId || isSaving) return;
    const previousValue = notificationsEnabled;
    const nextValue = !previousValue;

    setNotificationsEnabled(nextValue);

    setIsSaving(true);
    try {
      const result = await notificationsSource.updateNotificationsEnabled(calendarId);
      if (!result.success) {
        setNotificationsEnabled(previousValue);
        Alert.alert(String(t('error')), result.error ?? String(t('error')));
        return;
      }

      await syncSettingsSilently();
    } finally {
      setIsSaving(false);
    }
  };

  const updateStockMethod = async (method: StockDecrementMethod) => {
    if (!calendarId || !stockSource || method === stockMethod || isSaving) return;
    const previousMethod = stockMethod;

    setStockMethod(method);

    setIsSaving(true);
    try {
      const result = await stockSource.updateStockDecrementMethod(calendarId, method);
      if (!result.success) {
        setStockMethod(previousMethod);
        Alert.alert(String(t('error')), result.error ?? String(t('error')));
        return;
      }

      await syncSettingsSilently();
    } finally {
      setIsSaving(false);
    }
  };

  return {
    activeTab,
    backToCalendars: () => dismissToCalendars(router),
    error,
    isSaving,
    loading,
    loadSettings,
    notificationsEnabled,
    notFound,
    refreshing,
    setActiveTab,
    stockMethod,
    toggleNotifications,
    updateStockMethod,
  };
}
