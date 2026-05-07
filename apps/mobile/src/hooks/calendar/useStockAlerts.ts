import { useCallback, useMemo, useState } from 'react';
import { Alert, Linking } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { buildStockAlertActions, isStockAlertBox, isBoxMissingPillbox } from '@meditime/utils';
import type {
  ApiResult,
  CalendarBoxAlertItem,
  CalendarDetailSourceType,
} from '@meditime/types';
import { useCalendarApis } from './useCalendarApis';
import { dismissToCalendars } from './navigation';
import { toActionSheetItems } from '../../utils';

type StockAlertsSource = {
  fetchBoxes: (calendarId: string) => Promise<ApiResult>;
  restockBox: (calendarId: string, boxId: string) => Promise<ApiResult>;
};

type BoxesResult = ApiResult & {
  boxes?: CalendarBoxAlertItem[];
  status?: number;
};

function sortAlerts(a: CalendarBoxAlertItem, b: CalendarBoxAlertItem) {
  if (a.stock_quantity !== b.stock_quantity) {
    return a.stock_quantity - b.stock_quantity;
  }

  return a.name.localeCompare(b.name);
}

export function useStockAlerts(sourceType: Exclude<CalendarDetailSourceType, 'token'>) {
  const { calendarId } = useLocalSearchParams<{ calendarId?: string }>();
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { personalCalendarsApi, sharedUserCalendarsApi } = useCalendarApis();
  const lng = i18n.language || 'fr';
  const basePath = sourceType === 'personal' ? 'calendar' : 'shared-user-calendar';
  const [boxes, setBoxes] = useState<CalendarBoxAlertItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [restockingBoxId, setRestockingBoxId] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const source: StockAlertsSource = useMemo(
    () => sourceType === 'personal'
      ? {
          fetchBoxes: personalCalendarsApi.fetchPersonalBoxes,
          restockBox: personalCalendarsApi.personalRestockBox,
        }
      : {
          fetchBoxes: sharedUserCalendarsApi.fetchSharedUserBoxes,
          restockBox: sharedUserCalendarsApi.sharedUserRestockBox,
        },
    [personalCalendarsApi, sharedUserCalendarsApi, sourceType],
  );

  const loadAlerts = useCallback(async (mode: 'initial' | 'refresh' = 'initial') => {
    if (!calendarId) {
      setLoading(false);
      return;
    }

    if (mode === 'refresh') {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const result = await source.fetchBoxes(calendarId) as BoxesResult;

      if (result.success) {
        setBoxes((result.boxes ?? []).slice().sort(sortAlerts));
        setNotFound(false);
        return;
      }

      if (result.status === 404) {
        setNotFound(true);
        return;
      }

      setError(result.error ?? String(t('api.boxes.fetch_error')));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(t('api.boxes.fetch_error')));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [calendarId, source, t]);

  useFocusEffect(
    useCallback(() => {
      void loadAlerts();
    }, [loadAlerts]),
  );

  const alerts = useMemo(
    () => boxes.filter(isStockAlertBox),
    [boxes],
  );

  const sendSms = useCallback(() => {
    const title = String(t('boxes.stock.alerts.title'));
    const lines = alerts.map((box) => (
      isBoxMissingPillbox(box)
        ? String(t('boxes.stock.alerts.line_negative', {
            count: box.stock_quantity,
            dose: box.dose ?? 0,
            name: box.name,
          }))
        : String(t('boxes.stock.alerts.line', {
            count: box.stock_quantity,
            dose: box.dose ?? 0,
            name: box.name,
          }))
    ));
    const message = [title, ...lines].join('\n');

    void Linking.openURL(`sms:?&body=${encodeURIComponent(message)}`).catch(() => {
      Alert.alert(String(t('error')), String(t('send_sms')));
    });
  }, [alerts, t]);

  const navigateToHref = useCallback(
    (href: string) => {
      router.push(href as never);
    },
    [router],
  );

  const navigateToMissingPillbox = useCallback((boxId: string) => {
    if (!calendarId) return;

    const medsIdParam = encodeURIComponent(JSON.stringify([boxId]));
    router.push(`/calendars/${basePath}/${calendarId}/pillbox?medsId=${medsIdParam}` as never);
  }, [basePath, calendarId, router]);

  const restockBox = useCallback(async (boxId: string) => {
    if (!calendarId) return;

    setRestockingBoxId(boxId);
    try {
      const result = await source.restockBox(calendarId, boxId);

      if (result.success) {
        await loadAlerts('refresh');
        return;
      }

      Alert.alert(String(t('error')), result.error ?? String(t('api.boxes.refill_error')));
    } finally {
      setRestockingBoxId(null);
    }
  }, [calendarId, loadAlerts, source, t]);

  const translate = useCallback((key: string) => String(t(key)), [t]);

  const actions = useMemo(
    () => calendarId
      ? toActionSheetItems(
          buildStockAlertActions(
            { calendarId, lng, basePath },
            { onSendSms: sendSms },
          ),
          translate,
        )
      : [],
    [basePath, calendarId, lng, sendSms, translate],
  );

  return {
    actions,
    alerts,
    backToCalendars: () => dismissToCalendars(router),
    error,
    loadAlerts,
    loading,
    navigateToMissingPillbox,
    navigateToHref,
    notFound,
    refreshing,
    restockBox,
    restockingBoxId,
  };
}
