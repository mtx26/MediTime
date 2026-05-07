import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { getMondayDate, toISO } from '@meditime/utils';
import type {
  ApiResult,
  CalendarDetailSourceType,
  PillboxOrderedMed,
  PillboxTable,
} from '@meditime/types';
import { useCalendarApis } from './useCalendarApis';
import { dismissToCalendars } from './navigation';

type PillboxSource = {
  fetchSchedule: (calendarId: string, startDate?: string | null) => Promise<ApiResult>;
  fetchIfPillboxUsed: (calendarId: string, startDate?: string | null) => Promise<ApiResult>;
  decreaseStock: (calendarId: string, startDate?: string | null) => Promise<ApiResult>;
};

type ScheduleResult = ApiResult & { table?: PillboxTable; status?: number };
type UsedResult = ApiResult & { if_pillbox_used?: boolean };

export function usePillbox(sourceType: Exclude<CalendarDetailSourceType, 'token'>) {
  const { calendarId, date } = useLocalSearchParams<{ calendarId?: string; date?: string }>();
  const { t } = useTranslation();
  const router = useRouter();
  const { personalCalendarsApi, sharedUserCalendarsApi } = useCalendarApis();

  const selectedDate = useMemo(() => {
    const d = date ? new Date(date) : new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, [date]);

  const weekDates = useMemo(() => {
    const monday = getMondayDate(selectedDate)!;
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return d;
    });
  }, [selectedDate]);

  const [orderedMeds, setOrderedMeds] = useState<PillboxOrderedMed[]>([]);
  const [selectedMedIndex, setSelectedMedIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [isPillboxUsed, setIsPillboxUsed] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const source: PillboxSource = useMemo(() => {
    if (sourceType === 'personal') {
      return {
        fetchSchedule: personalCalendarsApi.fetchPersonalCalendarSchedule,
        fetchIfPillboxUsed: personalCalendarsApi.fetchIfPersonalPillboxUsed,
        decreaseStock: personalCalendarsApi.useMedicinesForPersonalPillbox,
      };
    }
    return {
      fetchSchedule: sharedUserCalendarsApi.fetchSharedUserCalendarSchedule,
      fetchIfPillboxUsed: sharedUserCalendarsApi.fetchIfSharedUserPillboxUsed,
      decreaseStock: sharedUserCalendarsApi.useMedicinesForSharedUserPillbox,
    };
  }, [personalCalendarsApi, sharedUserCalendarsApi, sourceType]);

  const loadPillbox = useCallback(async (mode: 'initial' | 'refresh' = 'initial') => {
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
      const dateISO = toISO(selectedDate);
      const [scheduleResult, usedResult] = await Promise.all([
        source.fetchSchedule(calendarId, dateISO) as Promise<ScheduleResult>,
        source.fetchIfPillboxUsed(calendarId, dateISO) as Promise<UsedResult>,
      ]);

      if (scheduleResult.success) {
        const table = scheduleResult.table ?? {};
        const timeOrder = ['morning', 'noon', 'evening'];
        const allMeds: PillboxOrderedMed[] = timeOrder.flatMap((moment) => {
          const meds = (table[moment] ?? []) as { title: string; cells: Record<string, number> }[];
          return meds
            .slice()
            .sort((a, b) => a.title.localeCompare(b.title))
            .map((med) => ({ ...med, moment }));
        });
        setOrderedMeds(allMeds);
        setSelectedMedIndex(0);
        setNotFound(false);
      } else if ((scheduleResult as { status?: number }).status === 404) {
        setNotFound(true);
      } else {
        setError(String(t('error')));
      }

      if (usedResult.success) {
        setIsPillboxUsed(!!usedResult.if_pillbox_used);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(t('error')));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [calendarId, selectedDate, source, t]);

  useEffect(() => {
    void loadPillbox('initial');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [calendarId, date]);

  const handleComplete = async () => {
    Alert.alert(
      String(t('confirm_calendar_completion')),
      String(t('pillbox_completion_description')),
      [
        { text: String(t('cancel')), style: 'cancel' },
        {
          text: String(t('confirm')),
          onPress: async () => {
            if (!calendarId) return;
            setIsCompleting(true);
            try {
              const result = await source.decreaseStock(calendarId, toISO(selectedDate));
              if (result.success) {
                router.back();
              } else {
                setError(String(t('pillbox_error_message')));
              }
            } finally {
              setIsCompleting(false);
            }
          },
        },
      ],
    );
  };

  return {
    loading,
    refreshing,
    notFound,
    isPillboxUsed,
    isCompleting,
    error,
    orderedMeds,
    selectedMedIndex,
    weekDates,
    loadPillbox,
    handleComplete,
    handleNextMed: () =>
      setSelectedMedIndex((prev) => (prev + 1 < orderedMeds.length ? prev + 1 : prev)),
    handlePreviousMed: () =>
      setSelectedMedIndex((prev) => (prev > 0 ? prev - 1 : 0)),
    backToCalendars: () => dismissToCalendars(router),
  };
}
