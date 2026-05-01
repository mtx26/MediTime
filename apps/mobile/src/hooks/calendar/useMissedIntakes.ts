import { useCallback, useMemo, useState } from 'react';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import type {
  ApiResult,
  CalendarBoxAlertItem,
  CalendarDetailSourceType,
  MissedIntakesPayload,
  TimeOfDay,
} from '@meditime/types';
import { useCalendarApis } from './useCalendarApis';
import { dismissToCalendars } from './navigation';

export type MissedMode = 'intake' | 'medication';
export type DateSelectionMode = 'individual' | 'range';

type BoxesResult = ApiResult & { boxes?: CalendarBoxAlertItem[]; status?: number };

export function toDateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function isBoxActive(box: CalendarBoxAlertItem): boolean {
  if (!box.conditions || box.conditions.length === 0) return true;
  const now = new Date();
  return box.conditions.some((c) => {
    if (!c.max_date) return true;
    return new Date(c.max_date) >= now;
  });
}

export function getBoxTimes(box: CalendarBoxAlertItem): TimeOfDay[] {
  if (!box.conditions) return [];
  const times = new Set<TimeOfDay>();
  for (const c of box.conditions) {
    if (!c.time_of_day) continue;
    if (c.max_date && new Date(c.max_date) < new Date()) continue;
    times.add(c.time_of_day as TimeOfDay);
  }
  return Array.from(times);
}

function expandRange(from: Date, to: Date): Date[] {
  const days: Date[] = [];
  const current = new Date(from);
  current.setHours(0, 0, 0, 0);
  const end = new Date(to);
  end.setHours(0, 0, 0, 0);
  while (current <= end) {
    days.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }
  return days;
}

export function useMissedIntakes(sourceType: Exclude<CalendarDetailSourceType, 'token'>) {
  const { calendarId } = useLocalSearchParams<{ calendarId?: string }>();
  const { t } = useTranslation();
  const router = useRouter();
  const { personalCalendarsApi, sharedUserCalendarsApi } = useCalendarApis();

  const [boxes, setBoxes] = useState<CalendarBoxAlertItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [mode, setMode] = useState<MissedMode>('intake');
  const [dateSelectionMode, setDateSelectionMode] = useState<DateSelectionMode>('individual');
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [fromDate, setFromDate] = useState<Date | null>(null);
  const [toDate, setToDate] = useState<Date | null>(null);
  const [selectedTimes, setSelectedTimes] = useState<TimeOfDay[]>([]);
  const [selectedMedIds, setSelectedMedIds] = useState<string[]>([]);

  const activeBoxes = useMemo(() => boxes.filter(isBoxActive), [boxes]);

  const effectiveDays = useMemo(() => {
    if (dateSelectionMode === 'range' && fromDate) {
      return expandRange(fromDate, toDate ?? fromDate);
    }
    return selectedDates.slice().sort((a, b) => a.getTime() - b.getTime());
  }, [dateSelectionMode, fromDate, toDate, selectedDates]);

  const isValid = useMemo(() => {
    if (effectiveDays.length === 0) return false;
    if (mode === 'intake') return selectedTimes.length > 0;
    return selectedMedIds.length > 0;
  }, [effectiveDays, mode, selectedTimes, selectedMedIds]);

  const fetchBoxes = useMemo(
    () =>
      sourceType === 'personal'
        ? personalCalendarsApi.fetchPersonalBoxes
        : sharedUserCalendarsApi.fetchSharedUserBoxes,
    [personalCalendarsApi, sharedUserCalendarsApi, sourceType],
  );

  const loadBoxes = useCallback(async () => {
    if (!calendarId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const result = (await fetchBoxes(calendarId)) as BoxesResult;
      if (result.success) {
        setBoxes((result.boxes ?? []) as CalendarBoxAlertItem[]);
        setNotFound(false);
      } else if (result.status === 404) {
        setNotFound(true);
      } else {
        setError(String(t('error')));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(t('error')));
    } finally {
      setLoading(false);
    }
  }, [calendarId, fetchBoxes, t]);

  useFocusEffect(useCallback(() => {
    void loadBoxes();
  }, [loadBoxes]));

  const toggleTime = (time: TimeOfDay) => {
    setSelectedTimes((prev) =>
      prev.includes(time) ? prev.filter((x) => x !== time) : [...prev, time],
    );
  };

  const toggleMedId = (id: string) => {
    setSelectedMedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const toggleDate = (date: Date) => {
    const key = toDateKey(date);
    setSelectedDates((prev) => {
      const exists = prev.some((d) => toDateKey(d) === key);
      if (exists) return prev.filter((d) => toDateKey(d) !== key);
      return [...prev, date];
    });
  };

  const handleNext = () => {
    const days = effectiveDays.map(toDateKey);
    let payload: MissedIntakesPayload;
    if (mode === 'intake') {
      payload = { mode: 'intake', days, times: selectedTimes };
    } else {
      payload = { mode: 'medication', days, med_ids: selectedMedIds };
    }
    const basePath =
      sourceType === 'personal'
        ? `/(tabs)/calendars/calendar/${calendarId}/missed-intakes/recap`
        : `/(tabs)/calendars/shared-user-calendar/${calendarId}/missed-intakes/recap`;
    router.push({
      pathname: basePath as Parameters<typeof router.push>[0],
      params: { payload: JSON.stringify(payload) },
    });
  };

  return {
    loading,
    notFound,
    error,
    mode,
    setMode,
    activeBoxes,
    effectiveDays,
    dateSelectionMode,
    setDateSelectionMode,
    selectedDates,
    toggleDate,
    fromDate,
    setFromDate,
    toDate,
    setToDate,
    selectedTimes,
    toggleTime,
    selectedMedIds,
    toggleMedId,
    isValid,
    handleNext,
    backToCalendars: () => dismissToCalendars(router),
  };
}
