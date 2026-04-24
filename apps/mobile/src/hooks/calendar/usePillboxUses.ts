import { useCallback, useMemo, useState } from 'react';
import { Alert } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { getMondayDate } from '@meditime/utils';
import type {
  ApiResult,
  CalendarDetailSourceType,
  PillboxUseItem,
  PillboxUsesResult,
} from '@meditime/types';
import { useCalendarApis } from './useCalendarApis';
import { dismissToCalendars } from './navigation';

type PillboxUsesSource = {
  fetchPillboxUses: (calendarId: string) => Promise<ApiResult>;
  cancelUse: (calendarId: string, useId: string) => Promise<ApiResult>;
};

export function usePillboxUses(sourceType: CalendarDetailSourceType) {
  const { calendarId } = useLocalSearchParams<{ calendarId?: string }>();
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { personalCalendarsApi, sharedUserCalendarsApi } = useCalendarApis();
  const [uses, setUses] = useState<PillboxUseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isMutating, setIsMutating] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const source: PillboxUsesSource = useMemo(
    () => sourceType === 'personal'
      ? {
          fetchPillboxUses: personalCalendarsApi.fetchPersonalPillboxUses,
          cancelUse: personalCalendarsApi.cancelUsePersonalPillbox,
        }
      : {
          fetchPillboxUses: sharedUserCalendarsApi.fetchSharedUserPillboxUses,
          cancelUse: sharedUserCalendarsApi.cancelUseSharedUserPillbox,
        },
    [personalCalendarsApi, sharedUserCalendarsApi, sourceType],
  );

  const loadUses = useCallback(async (mode: 'initial' | 'refresh' = 'initial') => {
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
      const result = await source.fetchPillboxUses(calendarId) as PillboxUsesResult;

      if (result.success) {
        setUses(result.pillbox_uses ?? []);
        setNotFound(false);
        return;
      }

      if (result.status === 404) {
        setNotFound(true);
        return;
      }

      setError(result.error ?? String(t('error')));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(t('error')));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [calendarId, source, t]);

  useFocusEffect(
    useCallback(() => {
      void loadUses();
    }, [loadUses]),
  );

  const cancelUse = async (useId: string) => {
    if (!calendarId) return;

    setIsMutating(true);
    try {
      const result = await source.cancelUse(calendarId, useId);
      if (result.success) {
        await loadUses('refresh');
        return;
      }

      Alert.alert(String(t('error')), result.error ?? String(t('error')));
    } finally {
      setIsMutating(false);
    }
  };

  const confirmCancelUse = (useId: string) => {
    Alert.alert(
      String(t('restore_pillbox_title')),
      String(t('restore_pillbox_description')),
      [
        { text: String(t('cancel')), style: 'cancel' },
        {
          text: String(t('restore')),
          onPress: () => {
            void cancelUse(useId);
          },
        },
      ],
    );
  };

  const formatWeek = (dateString: string) => {
    const monday = getMondayDate(dateString);
    if (!monday) return dateString;

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };
    const locale = i18n.language || 'en';

    return `${monday.toLocaleDateString(locale, options)} - ${sunday.toLocaleDateString(locale, options)}`;
  };

  const sortedUses = useMemo(
    () => [...uses].sort((a, b) => new Date(b.prepared_at).getTime() - new Date(a.prepared_at).getTime()),
    [uses],
  );

  return {
    backToCalendars: () => dismissToCalendars(router),
    confirmCancelUse,
    error,
    formatWeek,
    isMutating,
    loadUses,
    loading,
    notFound,
    refreshing,
    sortedUses,
  };
}
