
import { useState, useEffect, useContext, useCallback } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { useLoading } from '@/components/ui/loading';
import WeeklyEventContent from '@/components/calendar/WeeklyEventContent';
import { toISO, toDate } from '@meditime/utils';
import { getCalendarSourceMap, detectCalendarType } from '@meditime/utils';
import { UserContext } from '@/contexts/UserContext';
import { useTranslation } from 'react-i18next';
import { AlertTriangle } from 'lucide-react';
import AlertBanner from '@/components/common/AlertBanner';
import NotFound from '@/pages/general/NotFound';
import { useFilteredEventsForDay, useCalendarDayNavigation } from '@/hooks/calendar/useCalendarNavigation';
import type {
  CalendarScheduleSource,
  DailyCalendarPageProps,
  WeeklyEventItem,
} from '@meditime/types';

// Page d'affichage du mode "daily" (journalier)

export default function DailyCalendarPage({ personalCalendars, sharedUserCalendars, tokenCalendars }: DailyCalendarPageProps) {
  const location = useLocation();
  const params = useParams<{ lng?: string; calendarId?: string; sharedToken?: string }>();
  const { t } = useTranslation();
  const today = new Date().setHours(0,0,0,0);

  const selectedDateParam = new URLSearchParams(location.search).get('date') || today; // Date sélectionnée en paramètre ou aujourd'hui par défaut

  // 🔐 Contexte d'authentification
  const userContext = useContext(UserContext);
  const userInfo = userContext?.userInfo; // Contexte de l'utilisateur connecté

  // garder selectedDate comme objet Date pour manipulations faciles
  const [selectedDate, setSelectedDate] = useState<Date | null>(null); // Date JS

  useEffect(() => {
  if (selectedDateParam) {
    const parsedDate = toDate(selectedDateParam);
    setSelectedDate(parsedDate);
  } else {
    setSelectedDate(new Date(today));
  }
}, [selectedDateParam]);

  const [eventsForDay, setEventsForDay] = useState<WeeklyEventItem[]>([]); // Événements filtrés pour un jour spécifique
  const [calendarEvents, setCalendarEvents] = useState<WeeklyEventItem[]>([]); // Événements du calendrier
  const [calendarTable, setCalendarTable] = useState<Record<string, unknown>>({}); // Événements du calendrier
  const [isLowStock, setIsLowStock] = useState(false); // Indicateur de stock faible
  // Méthode de décrémentation du stock (pour affichage différencié)

  // 🔄 Références et chargement
  const [loading, setLoading] = useState(true); // État de chargement du calendrier
  const [notFound, setNotFound] = useState(false); // Erreur 404 si le calendrier n'existe pas

  const { calendarType, basePath } = detectCalendarType(location.pathname);
    const calendarId = calendarType === 'token' ? params.sharedToken : params.calendarId;
  
    const calendarSource = getCalendarSourceMap(
      personalCalendars,
      sharedUserCalendars,
      tokenCalendars
    )[calendarType] as unknown as CalendarScheduleSource;
  
    // Fonction pour naviguer vers une date
    const onSelectDate = (dateInput: string | number | Date) => {
      // accepte Date ou ISO string
      const d = dateInput instanceof Date ? dateInput : new Date(dateInput);
      setSelectedDate(d);
      setEventsForDay(calendarEvents.filter((e) => e.start.startsWith(toISO(d))));
    };
  
    // Fonction pour naviguer vers la semaine suivante ou precedente
    // accepte un second argument optionnel `desiredSelectedDate` (ISO string)
    // pour préserver le jour sélectionné lors du changement de semaine.
    const onWeekSelect = useCallback(async (newSelectedDate: Date) => {
      onSelectDate(newSelectedDate);
      const isoDate = toISO(newSelectedDate);
      const rep = await calendarSource.fetchSchedule(calendarId, isoDate);
      if (rep.success) {
        setCalendarEvents((rep.schedule as WeeklyEventItem[]) || []);
        setCalendarTable(rep.table || {});
      }
    }, [calendarId, calendarSource, onSelectDate]);
  
    const { navigateDay, navigateWeek } = useCalendarDayNavigation(selectedDate, setSelectedDate, onWeekSelect);
  
    // Fonction pour charger le calendrier lorsque l'utilisateur est connecté ou que le calendrier est un token
    useEffect(() => {
      if (!calendarId) return setLoading(true);
      if (calendarType === 'personal' || calendarType === 'sharedUser') {
        if (!userInfo) return setLoading(true);
      }
      if (!selectedDate) return;
      const load = async () => {
        const rep = await calendarSource.fetchSchedule(calendarId, selectedDate ? toISO(selectedDate) : undefined);
        if (rep.success) {
          const nextSchedule = (rep.schedule as WeeklyEventItem[]) || [];
          if (JSON.stringify(nextSchedule) !== JSON.stringify(calendarEvents)) {
            setCalendarEvents(nextSchedule);
          }
          const nextTable = rep.table || {};
          if (JSON.stringify(nextTable) !== JSON.stringify(calendarTable)) {
            setCalendarTable(nextTable);
          }
          if (rep.ifLowStock !== undefined && rep.ifLowStock !== isLowStock) {
            setIsLowStock(rep.ifLowStock);
            // TODO: Hook pour alerte stock faible en temps réel
          }
          setLoading(false);
        } else {
          // Si l'API retourne un 404, le calendrier n'existe pas
          if (rep.status === 404) {
            setNotFound(true);
          }
          setLoading(false);
        }
      };
  
      void load();
    }, [calendarId, calendarEvents, calendarSource, calendarTable, isLowStock, userInfo, selectedDate]);

    useFilteredEventsForDay(selectedDate, calendarEvents, setEventsForDay);

  const { showLoading } = useLoading();

  useEffect(() => {
    showLoading(Boolean(loading === true && calendarId), t('calendar.loading_daily_view'));
  }, [loading, calendarId, showLoading, t]);

  if (loading === true && calendarId) {
    return null;
  }

  if (notFound) {
    return <NotFound />;
  }

  return (
    <div className="daily-calendar-page">
      {/* Affichage alert stock */}
      {isLowStock && (
        <AlertBanner
          to={`/${params.lng || 'fr'}/${basePath}/${calendarId}/stock-alerts`}
          icon={AlertTriangle}
          text={t('stock_alert')}
          tooltip={t('stock_alert_tooltip')}
          variant="warning"
        />
      )}
      <div className="max-w-200 mx-auto border shadow rounded my-4 p-3">
        <WeeklyEventContent
          ifModal={false}
          selectedDate={selectedDate}
          eventsForDay={eventsForDay}
          onSelectDate={onSelectDate}
          onNext={() => navigateDay(1)}
          onPrev={() => navigateDay(-1)}
          getPastWeek={() => navigateWeek(-1)}
          getNextWeek={() => navigateWeek(1)}
        />
      </div>
    </div>
  );
}
