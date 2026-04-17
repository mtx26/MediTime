import { useEffect, useContext, useRef, useState, useMemo } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import FullCalendar from '@fullcalendar/react';
import { UserContext } from '@/contexts/UserContext';
import { useLoading } from '@/components/ui/loading';
import { toISO, getCalendarSourceMap, detectCalendarType } from '@meditime/utils';
import { STOCK_DECREMENT_METHODS } from '@meditime/constants';
import { useAlert } from '@/contexts/AlertContext';
import { useFilteredEventsForDay } from '@/hooks/calendar/useCalendarNavigation';
import { useTranslation } from 'react-i18next';
import type {
  CalendarTable,
  CalendarViewSource,
  DateModalRef,
  WeeklyEventItem,
  DailyCalendarPageProps as CalendarViewProps,
} from '@meditime/types';

export function useCalendarData({
  personalCalendars,
  sharedUserCalendars,
  tokenCalendars,
}: CalendarViewProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams<{ lng?: string; calendarId?: string; sharedToken?: string }>();
  const { lng } = params;
  const { t } = useTranslation();

  const userContext = useContext(UserContext);
  const userInfo = userContext?.userInfo;
  const { showLoading } = useLoading();
  const { showConfirm } = useAlert();

  const calendarRef = useRef<InstanceType<typeof FullCalendar> | null>(null);
  const dateModalRef = useRef<DateModalRef | null>(null);

  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [eventsForDay, setEventsForDay] = useState<WeeklyEventItem[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<WeeklyEventItem[]>([]);
  const [calendarTable, setCalendarTable] = useState<CalendarTable>({});
  const [isLowStock, setIsLowStock] = useState(false);
  const [stockDecrementMethod, setStockDecrementMethod] = useState('');
  const [loadingStockMethod, setLoadingStockMethod] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const initialNextDate = useMemo(() => new Date(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).setHours(0, 0, 0, 0)), []);

  const { calendarType, basePath } = detectCalendarType(location.pathname);
  const calendarId = calendarType === 'token' ? params.sharedToken : params.calendarId;

  const calendarSource = getCalendarSourceMap(
    personalCalendars,
    sharedUserCalendars,
    tokenCalendars
  )[calendarType] as unknown as CalendarViewSource;

  // Navigation
  const onSelectDate = (dateInput: string | number | Date) => {
    const d = dateInput instanceof Date ? dateInput : new Date(dateInput);
    setSelectedDate(d);
    setEventsForDay(calendarEvents.filter((e) => e.start.startsWith(toISO(d))));
  };

  const onWeekSelect = async (newSelectedDate: Date) => {
    onSelectDate(newSelectedDate);
    const isoDate = toISO(newSelectedDate);
    const rep = await calendarSource.fetchSchedule(calendarId, isoDate);
    if (rep.success) {
      setCalendarEvents((rep.schedule || []) as WeeklyEventItem[]);
      setCalendarTable((rep.table || {}) as CalendarTable);
      calendarRef.current?.getApi().gotoDate(isoDate);
    }
  };

  const handleDateClick = (info: { dateStr: string }) => {
    setSelectedDate(new Date(info.dateStr));
    dateModalRef.current?.open();
  };

  const navigateDay = (direction: number) => {
    if (!selectedDate) return;
    const current = new Date(selectedDate);
    current.setDate(current.getDate() + direction);
    setSelectedDate(current);
  };

  const navigateWeek = (direction: number) => {
    if (!selectedDate) return;
    const current = new Date(selectedDate);
    current.setDate(current.getDate() + direction);
    void onWeekSelect(current);
  };

  // Data fetching
  useEffect(() => {
    if (!calendarId) return setLoading(false);
    if (!selectedDate) return;
    if (calendarType === 'personal' || calendarType === 'sharedUser') {
      if (!userInfo) return setLoading(true);
    }
    const load = async () => {
      const rep = await calendarSource.fetchSchedule(calendarId, toISO(selectedDate));
      if (rep.success) {
        const nextSchedule = (rep.schedule || []) as WeeklyEventItem[];
        setCalendarEvents(prev => JSON.stringify(nextSchedule) !== JSON.stringify(prev) ? nextSchedule : prev);
        const nextTable = (rep.table || {}) as CalendarTable;
        setCalendarTable(prev => JSON.stringify(nextTable) !== JSON.stringify(prev) ? nextTable : prev);
        setIsLowStock(prev => rep.ifLowStock !== undefined && rep.ifLowStock !== prev ? rep.ifLowStock : prev);
      } else {
        if (rep.status === 404) {
          setNotFound(true);
        }
      }
      setLoading(false);
    };
    void load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [calendarId, calendarType, userInfo, selectedDate]);

  useEffect(() => {
    showLoading(Boolean((loading === true || loadingStockMethod === true) && calendarId), t('loading_calendar'));
  }, [loading, loadingStockMethod, calendarId, showLoading, t]);

  useEffect(() => {
    const fetchMethod = async () => {
      if (!calendarId) return setLoadingStockMethod(false);
      if (calendarType === 'personal' || calendarType === 'sharedUser') {
        if (!userInfo) return setLoadingStockMethod(true);
      }
      const rep = await calendarSource.fetchStockDecrementMethod(calendarId);
      if (rep.success) {
        const method = rep.method || '';
        setStockDecrementMethod(method);
        if (method === STOCK_DECREMENT_METHODS.WEEKLY_PILLBOX) {
          setSelectedDate(new Date(initialNextDate));
        } else {
          setSelectedDate(new Date(new Date().setHours(0, 0, 0, 0)));
        }
      } else if (rep.status === 404) {
        setNotFound(true);
        setSelectedDate(new Date(new Date().setHours(0, 0, 0, 0)));
      }
      setLoadingStockMethod(false);
    };
    void fetchMethod();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [calendarId, calendarType, userInfo]);

  // Calendar actions
  const handleDeleteCalendar = () => {
    showConfirm(
      'confirm-danger',
      t('calendar.delete_title'),
      t('calendar.delete_description'),
      async () => {
        if (!calendarId) return;
        const rep = await personalCalendars.deleteCalendar(calendarId);
        if (rep.success) {
          navigate(`/${lng}/calendars`);
        }
      }
    );
  };

  const handleDeleteSharedCalendar = () => {
    showConfirm(
      'confirm-danger',
      t('calendar.delete_shared_title'),
      t('calendar.delete_shared_description'),
      async () => {
        const rep = await sharedUserCalendars.deleteSharedCalendar(calendarId!);
        if (rep.success) {
          navigate(`/${lng}/calendars`);
        }
      }
    );
  };

  // Filtered events
  useFilteredEventsForDay(selectedDate, calendarEvents, setEventsForDay);

  const memoizedEvents = useMemo(() => {
    return calendarEvents.map((event) => ({
      title: `${event.title} ${event.dose != null ? `${event.dose} mg` : ''} (${event.tablet_count})`,
      start: event.start,
      color: event.color,
    }));
  }, [calendarEvents]);

  return {
    // Route info
    lng,
    calendarType,
    basePath,
    calendarId,
    calendarSource,
    // Refs
    calendarRef,
    dateModalRef,
    // State
    selectedDate,
    eventsForDay,
    calendarTable,
    isLowStock,
    stockDecrementMethod,
    notFound,
    setNotFound,
    memoizedEvents,
    // Navigation
    onSelectDate,
    onWeekSelect,
    handleDateClick,
    navigateDay,
    navigateWeek,
    // Actions
    handleDeleteCalendar,
    handleDeleteSharedCalendar,
  };
}
