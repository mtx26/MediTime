import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { STOCK_DECREMENT_METHODS } from '@meditime/constants';
import {
  buildPersonalCalendarActions,
  buildSharedCalendarActions,
  calendarTableHasItems,
  filterEventsForDate,
  getFirstRouteParam,
  getInitialSelectedDateForStockMethod,
  getMondayDate,
  toISO,
} from '@meditime/utils';
import type {
  ApiResult,
  CalendarDetailMode,
  CalendarDetailSourceType,
  CalendarScheduleResult,
  CalendarTable,
  PillboxUsesResult,
  StockMethodResult,
  WeeklyEventItem,
} from '@meditime/types';
import { useCalendarApis } from './useCalendarApis';
import { dismissToCalendars } from './navigation';
import { openPdfUrl, toActionSheetItems } from '../../utils';

type CalendarSource = {
  fetchSchedule: (calendarId: string, startDate?: string | null) => Promise<ApiResult>;
  fetchStockDecrementMethod?: (calendarId: string) => Promise<ApiResult>;
  fetchPillboxUses?: (calendarId: string) => Promise<ApiResult>;
  deleteCalendar?: (calendarId: string) => Promise<ApiResult>;
  getPdfUrl?: (calendarId: string, includeInactive: boolean) => string;
};

const HEADER_TITLE_MAX_LENGTH = 26;

function truncateHeaderTitle(value: string) {
  if (value.length <= HEADER_TITLE_MAX_LENGTH) return value;
  return `${value.slice(0, HEADER_TITLE_MAX_LENGTH - 1)}...`;
}

function getInitialSelectedDateForDailyRoute(dateParam: string | string[] | undefined) {
  const rawDate = getFirstRouteParam(dateParam);

  if (rawDate) {
    const isoDateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(rawDate);
    const parsedDate = isoDateMatch
      ? new Date(Number(isoDateMatch[1]), Number(isoDateMatch[2]) - 1, Number(isoDateMatch[3]))
      : new Date(rawDate);

    if (!Number.isNaN(parsedDate.getTime())) {
      parsedDate.setHours(0, 0, 0, 0);
      return parsedDate;
    }
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

type MobileCalendarDetailSourceType = Exclude<CalendarDetailSourceType, 'token'>;

export function useCalendarDetail(sourceType: MobileCalendarDetailSourceType, mode: CalendarDetailMode) {
  const {
    calendarId,
    date,
  } = useLocalSearchParams<{ calendarId?: string; date?: string | string[] }>();
  const { t } = useTranslation();
  const router = useRouter();
  const { personalCalendarsApi, sharedUserCalendarsApi } = useCalendarApis();
  const routeId = calendarId;
  const basePath = sourceType === 'personal' ? 'calendar' : 'shared-user-calendar';

  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [eventsForDay, setEventsForDay] = useState<WeeklyEventItem[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<WeeklyEventItem[]>([]);
  const [calendarTable, setCalendarTable] = useState<CalendarTable>({});
  const [isLowStock, setIsLowStock] = useState(false);
  const [stockDecrementMethod, setStockDecrementMethod] = useState('');
  const [calendarName, setCalendarName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pdfDialogOpen, setPdfDialogOpen] = useState(false);
  const [includeInactive, setIncludeInactive] = useState(false);
  const [preparedWeekMondayIsos, setPreparedWeekMondayIsos] = useState<Set<string>>(new Set());

  const source: CalendarSource = useMemo(() => {
    if (sourceType === 'personal') {
      return {
        fetchSchedule: personalCalendarsApi.fetchPersonalCalendarSchedule,
        fetchStockDecrementMethod: personalCalendarsApi.fetchPersonalStockDecrementMethod,
        fetchPillboxUses: personalCalendarsApi.fetchPersonalPillboxUses,
        deleteCalendar: personalCalendarsApi.deleteCalendar,
        getPdfUrl: personalCalendarsApi.getPersonalCalendarPdfUrl,
      };
    }

    return {
      fetchSchedule: sharedUserCalendarsApi.fetchSharedUserCalendarSchedule,
      fetchStockDecrementMethod: sharedUserCalendarsApi.fetchSharedUserStockDecrementMethod,
      fetchPillboxUses: sharedUserCalendarsApi.fetchSharedUserPillboxUses,
      deleteCalendar: sharedUserCalendarsApi.deleteSharedCalendar,
      getPdfUrl: personalCalendarsApi.getPersonalCalendarPdfUrl,
    };
  }, [personalCalendarsApi, sharedUserCalendarsApi, sourceType]);

  const loadSchedule = useCallback(
    async (date: Date, showRefresh = false) => {
      if (!routeId) return;
      if (showRefresh) setRefreshing(true);
      if (!showRefresh) setScheduleLoading(true);
      setError(null);

      try {
        const result = await source.fetchSchedule(routeId, toISO(date)) as CalendarScheduleResult;

        if (result.success) {
          const nextEvents = result.schedule ?? [];
          const nextTable = result.table ?? {};
          setCalendarEvents(nextEvents);
          setCalendarTable(nextTable);
          setEventsForDay(filterEventsForDate(nextEvents, date));
          setIsLowStock(Boolean(result.ifLowStock));
          if (result.calendarName) setCalendarName(result.calendarName);
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
        if (showRefresh) setRefreshing(false);
        if (!showRefresh) setScheduleLoading(false);
      }
    },
    [routeId, source, t],
  );

  const loadCalendar = useCallback(async () => {
    if (!routeId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (mode === 'daily' || !source.fetchStockDecrementMethod) {
        const initialDate = getInitialSelectedDateForDailyRoute(date);
        setStockDecrementMethod('');
        setSelectedDate(initialDate);
        await loadSchedule(initialDate);
        return;
      }

      const stockResult = await source.fetchStockDecrementMethod(routeId) as StockMethodResult;
      const method = stockResult.success ? stockResult.method ?? '' : '';
      const initialDate = getInitialSelectedDateForStockMethod(method);

      if (!stockResult.success && stockResult.status === 404) {
        setNotFound(true);
      }

      setStockDecrementMethod(method);
      setSelectedDate(initialDate);

      if (method === STOCK_DECREMENT_METHODS.WEEKLY_PILLBOX && source.fetchPillboxUses) {
        void source.fetchPillboxUses(routeId).then((result) => {
          const usesResult = result as PillboxUsesResult;
          if (usesResult.success && usesResult.pillbox_uses) {
            setPreparedWeekMondayIsos(new Set(
              usesResult.pillbox_uses
                .map((use) => getMondayDate(use.prepared_at))
                .filter((d): d is Date => d !== null)
                .map(toISO),
            ));
          }
        });
      }

      await loadSchedule(initialDate);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(t('error')));
    } finally {
      setLoading(false);
    }
  }, [date, loadSchedule, mode, routeId, source, t]);

  useFocusEffect(
    useCallback(() => {
      void loadCalendar();
    }, [loadCalendar]),
  );

  useEffect(() => {
    if (!selectedDate) return;
    setEventsForDay(filterEventsForDate(calendarEvents, selectedDate));
  }, [calendarEvents, selectedDate]);

  const translate = useCallback((key: string) => String(t(key)), [t]);

  const navigateToHref = useCallback(
    (href: string) => {
      const path = href.replace(/^\/(calendar|shared-user-calendar)\//, '/calendars/$1/');
      router.push(path as never);
    },
    [router],
  );

  const selectDate = (date: Date) => {
    setSelectedDate(date);
    setEventsForDay(filterEventsForDate(calendarEvents, date));
  };

  const selectWeek = async (date: Date) => {
    setSelectedDate(date);
    await loadSchedule(date);
  };

  const navigateDay = (direction: number) => {
    if (!selectedDate) return;
    const next = new Date(selectedDate);
    next.setDate(next.getDate() + direction);
    selectDate(next);
  };

  const navigateWeek = (direction: number) => {
    if (!selectedDate) return;
    const next = new Date(selectedDate);
    next.setDate(next.getDate() + direction);
    void selectWeek(next);
  };

  const handleRefresh = () => {
    if (selectedDate) {
      void loadSchedule(selectedDate, true);
      return;
    }
    void loadCalendar();
  };

  const backToCalendars = () => {
    dismissToCalendars(router);
  };

  const goToPillbox = () => {
    if (!routeId) return;
    router.push(`/calendars/${basePath}/${routeId}/pillbox?date=${toISO(selectedDate || new Date())}` as never);
  };

  const goToBoxes = () => {
    if (!routeId) return;
    router.push(`/calendars/${basePath}/${routeId}/boxes` as never);
  };

  const goToStockAlerts = () => {
    if (!routeId) return;
    router.push(`/calendars/${basePath}/${routeId}/stock-alerts` as never);
  };

  const handleDelete = () => {
    if (!routeId || !source.deleteCalendar) return;
    const deleteCalendar = source.deleteCalendar;

    Alert.alert(
      String(t(sourceType === 'personal' ? 'calendar.delete_title' : 'calendar.delete_shared_title')),
      String(t(sourceType === 'personal' ? 'calendar.delete_description' : 'calendar.delete_shared_description')),
      [
        { text: String(t('cancel')), style: 'cancel' },
        {
          text: String(t('delete')),
          style: 'destructive',
          onPress: () => {
            void deleteCalendar(routeId).then((result) => {
              if (result.success) {
                backToCalendars();
                return;
              }
              Alert.alert(String(t('error')), result.error ?? String(t('error')));
            });
          },
        },
      ],
    );
  };

  const handleExportPdf = () => {
    if (!routeId || !source.getPdfUrl) return;
    setIncludeInactive(false);
    setPdfDialogOpen(true);
  };

  const handleDownloadPdf = async () => {
    if (!routeId || !source.getPdfUrl) return;
    try {
      await openPdfUrl(source.getPdfUrl(routeId, includeInactive));
      setPdfDialogOpen(false);
    } catch {
      Alert.alert(String(t('api.calendar.pdf_download_error')), String(t('api.calendar.pdf_download_error')));
    }
  };

  const actions = useMemo(() => {
    if (mode === 'daily') return [];
    if (!routeId) return [];

    const context = { calendarId: routeId, basePath, selectedDate };
    const handlers = {
      onDelete: handleDelete,
      onExportPdf: handleExportPdf,
    };
    const items = sourceType === 'personal'
      ? buildPersonalCalendarActions(
          context,
          { ...handlers, onRename: undefined },
          ['rename', 'medicines'],
        )
      : buildSharedCalendarActions(context, handlers, ['rename', 'medicines']);

    return toActionSheetItems(items, translate);
  }, [basePath, mode, routeId, selectedDate, sourceType, translate]);

  const hasCalendarItems = calendarTableHasItems(calendarTable);
  const isDailyRoute = mode === 'daily';

  return {
    actions,
    backToCalendars,
    basePath,
    calendarTable,
    error,
    eventsForDay,
    goToBoxes,
    goToPillbox,
    goToStockAlerts,
    handleDownloadPdf,
    handleRefresh,
    headerTitle: truncateHeaderTitle(calendarName ?? String(t('calendars'))),
    isLowStock,
    loading,
    navigateDay,
    navigateToHref,
    navigateWeek,
    notFound,
    refreshing,
    selectedDate,
    selectDate,
    selectWeek,
    pdfDialogOpen,
    setPdfDialogOpen,
    includeInactive,
    setIncludeInactive,
    showMedicinesButton: !isDailyRoute,
    showWeekSelector: !isDailyRoute,
    showBackendLoading: scheduleLoading && !loading,
    showCalendarContent: isDailyRoute || hasCalendarItems || scheduleLoading,
    showDailyContent: isDailyRoute || stockDecrementMethod === STOCK_DECREMENT_METHODS.DAILY_MIDNIGHT,
    showPillboxShortcut: !isDailyRoute && hasCalendarItems && stockDecrementMethod === STOCK_DECREMENT_METHODS.WEEKLY_PILLBOX,
    hasCalendarItems,
    preparedWeekMondayIsos,
  };
}
