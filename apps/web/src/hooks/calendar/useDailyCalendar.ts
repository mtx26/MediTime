import { useState, useEffect, useContext, useCallback } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { useLoading } from '@/components/ui/loading';
import { toISO, toDate, getCalendarSourceMap, detectCalendarType } from '@meditime/utils';
import { UserContext } from '@/contexts/UserContext';
import { useTranslation } from 'react-i18next';
import { useFilteredEventsForDay, useCalendarDayNavigation } from '@/hooks/calendar/useCalendarNavigation';
import type {
  CalendarScheduleSource,
  DailyCalendarPageProps,
  WeeklyEventItem,
} from '@meditime/types';

export function useDailyCalendar({
  personalCalendars,
  sharedUserCalendars,
  tokenCalendars,
}: DailyCalendarPageProps) {
  const location = useLocation();
  const params = useParams<{ lng?: string; calendarId?: string; sharedToken?: string }>();
  const { t } = useTranslation();
  const { showLoading } = useLoading();

  const userContext = useContext(UserContext);
  const userInfo = userContext?.userInfo;

  const selectedDateParam = new URLSearchParams(location.search).get('date');

  const { calendarType, basePath } = detectCalendarType(location.pathname);
  const calendarId = calendarType === 'token' ? params.sharedToken : params.calendarId;

  const calendarSource = getCalendarSourceMap(
    personalCalendars,
    sharedUserCalendars,
    tokenCalendars,
  )[calendarType] as unknown as CalendarScheduleSource;

  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [eventsForDay, setEventsForDay] = useState<WeeklyEventItem[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<WeeklyEventItem[]>([]);
  const [calendarTable, setCalendarTable] = useState<Record<string, unknown>>({});
  const [isLowStock, setIsLowStock] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (selectedDateParam) {
      setSelectedDate(toDate(selectedDateParam));
    } else {
      setSelectedDate(new Date(new Date().setHours(0, 0, 0, 0)));
    }
  }, [selectedDateParam]);

  const onSelectDate = (dateInput: string | number | Date) => {
    const d = dateInput instanceof Date ? dateInput : new Date(dateInput);
    setSelectedDate(d);
    setEventsForDay(calendarEvents.filter((e) => e.start.startsWith(toISO(d))));
  };

  const onWeekSelect = useCallback(
    async (newSelectedDate: Date) => {
      onSelectDate(newSelectedDate);
      const isoDate = toISO(newSelectedDate);
      const rep = await calendarSource.fetchSchedule(calendarId, isoDate);
      if (rep.success) {
        setCalendarEvents((rep.schedule as WeeklyEventItem[]) || []);
        setCalendarTable(rep.table || {});
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [calendarId, calendarSource],
  );

  const { navigateDay, navigateWeek } = useCalendarDayNavigation(
    selectedDate,
    setSelectedDate,
    onWeekSelect,
  );

  useEffect(() => {
    if (!calendarId) return setLoading(true);
    if ((calendarType === 'personal' || calendarType === 'sharedUser') && !userInfo)
      return setLoading(true);
    if (!selectedDate) return;

    const load = async () => {
      const rep = await calendarSource.fetchSchedule(calendarId, toISO(selectedDate));
      if (rep.success) {
        const nextSchedule = (rep.schedule as WeeklyEventItem[]) || [];
        if (JSON.stringify(nextSchedule) !== JSON.stringify(calendarEvents))
          setCalendarEvents(nextSchedule);
        const nextTable = rep.table || {};
        if (JSON.stringify(nextTable) !== JSON.stringify(calendarTable))
          setCalendarTable(nextTable);
        if (rep.ifLowStock !== undefined && rep.ifLowStock !== isLowStock)
          setIsLowStock(rep.ifLowStock);
      } else if (rep.status === 404) {
        setNotFound(true);
      }
      setLoading(false);
    };

    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [calendarId, calendarType, userInfo, selectedDate]);

  useEffect(() => {
    showLoading(Boolean(loading && calendarId), t('calendar.loading_daily_view'));
  }, [loading, calendarId, showLoading, t]);

  useFilteredEventsForDay(selectedDate, calendarEvents, setEventsForDay);

  return {
    lng: params.lng,
    basePath,
    calendarId,
    selectedDate,
    eventsForDay,
    isLowStock,
    loading,
    notFound,
    onSelectDate,
    navigateDay,
    navigateWeek,
  };
}
