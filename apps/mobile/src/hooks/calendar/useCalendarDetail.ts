import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useTranslation } from 'react-i18next';
import { STOCK_DECREMENT_METHODS } from '@meditime/constants';
import {
  buildPersonalCalendarActions,
  buildSharedCalendarActions,
  calendarTableHasItems,
  filterEventsForDate,
  getInitialSelectedDateForStockMethod,
  toISO,
} from '@meditime/utils';
import type {
  ApiResult,
  CalendarDetailMode,
  CalendarDetailSourceType,
  CalendarScheduleResult,
  CalendarTable,
  StockMethodResult,
  WeeklyEventItem,
} from '@meditime/types';
import { useCalendarApis } from './useCalendarApis';
import { toActionSheetItems, toMobileHref } from '../../utils';

type CalendarSource = {
  fetchSchedule: (calendarId: string, startDate?: string | null) => Promise<ApiResult>;
  fetchStockDecrementMethod: (calendarId: string) => Promise<ApiResult>;
  deleteCalendar: (calendarId: string) => Promise<ApiResult>;
  getPdfUrl: (calendarId: string, includeInactive: boolean) => string;
};

const HEADER_TITLE_MAX_LENGTH = 26;

function truncateHeaderTitle(value: string) {
  if (value.length <= HEADER_TITLE_MAX_LENGTH) return value;
  return `${value.slice(0, HEADER_TITLE_MAX_LENGTH - 1)}...`;
}

function getRouteDateParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function getInitialSelectedDateForDailyRoute(dateParam: string | string[] | undefined) {
  const rawDate = getRouteDateParam(dateParam);

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

export function useCalendarDetail(sourceType: CalendarDetailSourceType, mode: CalendarDetailMode) {
  const { calendarId, date } = useLocalSearchParams<{ calendarId?: string; date?: string | string[] }>();
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { personalCalendarsApi, sharedUserCalendarsApi } = useCalendarApis();
  const lng = i18n.language || 'fr';
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

  const source: CalendarSource = useMemo(() => {
    if (sourceType === 'personal') {
      return {
        fetchSchedule: personalCalendarsApi.fetchPersonalCalendarSchedule,
        fetchStockDecrementMethod: personalCalendarsApi.fetchPersonalStockDecrementMethod,
        deleteCalendar: personalCalendarsApi.deleteCalendar,
        getPdfUrl: personalCalendarsApi.getPersonalCalendarPdfUrl,
      };
    }

    return {
      fetchSchedule: sharedUserCalendarsApi.fetchSharedUserCalendarSchedule,
      fetchStockDecrementMethod: sharedUserCalendarsApi.fetchSharedUserStockDecrementMethod,
      deleteCalendar: sharedUserCalendarsApi.deleteSharedCalendar,
      getPdfUrl: personalCalendarsApi.getPersonalCalendarPdfUrl,
    };
  }, [personalCalendarsApi, sharedUserCalendarsApi, sourceType]);

  const loadSchedule = useCallback(
    async (date: Date, showRefresh = false) => {
      if (!calendarId) return;
      if (showRefresh) setRefreshing(true);
      if (!showRefresh) setScheduleLoading(true);
      setError(null);

      try {
        const result = await source.fetchSchedule(calendarId, toISO(date)) as CalendarScheduleResult;

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
    [calendarId, source, t],
  );

  const loadCalendar = useCallback(async () => {
    if (!calendarId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (mode === 'daily') {
        const initialDate = getInitialSelectedDateForDailyRoute(date);
        setStockDecrementMethod('');
        setSelectedDate(initialDate);
        await loadSchedule(initialDate);
        return;
      }

      const stockResult = await source.fetchStockDecrementMethod(calendarId) as StockMethodResult;
      const method = stockResult.success ? stockResult.method ?? '' : '';
      const initialDate = getInitialSelectedDateForStockMethod(method);

      if (!stockResult.success && stockResult.status === 404) {
        setNotFound(true);
      }

      setStockDecrementMethod(method);
      setSelectedDate(initialDate);
      await loadSchedule(initialDate);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(t('error')));
    } finally {
      setLoading(false);
    }
  }, [calendarId, date, loadSchedule, mode, source, t]);

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
      router.push(toMobileHref(href) as never);
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
    router.replace('/calendars' as never);
  };

  const goToPillbox = () => {
    if (!calendarId) return;
    navigateToHref(`/${lng}/${basePath}/${calendarId}/pillbox?date=${toISO(selectedDate || new Date())}`);
  };

  const goToBoxes = () => {
    if (!calendarId) return;
    navigateToHref(`/${lng}/${basePath}/${calendarId}/boxes`);
  };

  const goToStockAlerts = () => {
    if (!calendarId) return;
    navigateToHref(`/${lng}/${basePath}/${calendarId}/stock-alerts`);
  };

  const handleDelete = () => {
    Alert.alert(
      String(t(sourceType === 'personal' ? 'calendar.delete_title' : 'calendar.delete_shared_title')),
      String(t(sourceType === 'personal' ? 'calendar.delete_description' : 'calendar.delete_shared_description')),
      [
        { text: String(t('cancel')), style: 'cancel' },
        {
          text: String(t('delete')),
          style: 'destructive',
          onPress: () => {
            if (!calendarId) return;
            void source.deleteCalendar(calendarId).then((result) => {
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
    if (!calendarId) return;
    void WebBrowser
      .openBrowserAsync(source.getPdfUrl(calendarId, false), {
        dismissButtonStyle: 'close',
        presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET,
      })
      .catch(() => {
        Alert.alert(String(t('api.calendar.pdf_download_error')), String(t('api.calendar.pdf_download_error')));
      });
  };

  const actions = useMemo(() => {
    if (mode === 'daily') return [];
    if (!calendarId) return [];

    const context = { calendarId, lng, basePath, selectedDate };
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
  }, [basePath, calendarId, lng, mode, selectedDate, sourceType, translate]);

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
    showOverviewControls: !isDailyRoute,
    showBackendLoading: (scheduleLoading || refreshing) && !loading,
    showCalendarContent: isDailyRoute || hasCalendarItems,
    showDailyContent: isDailyRoute || stockDecrementMethod === STOCK_DECREMENT_METHODS.DAILY_MIDNIGHT,
    showPillboxShortcut: !isDailyRoute && hasCalendarItems && stockDecrementMethod === STOCK_DECREMENT_METHODS.WEEKLY_PILLBOX,
    hasCalendarItems,
  };
}
