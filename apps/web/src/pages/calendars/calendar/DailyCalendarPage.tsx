
import { useState, useEffect, useContext } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import { useLoading } from '@/components/ui/loading';
import WeeklyEventContent from '@/components/calendar/WeeklyEventContent';
import { toISO, toDate } from '@meditime/utils';
import { getCalendarSourceMap } from '@meditime/utils';
import { UserContext } from '@/contexts/UserContext';
import { useTranslation } from 'react-i18next';
import { Alert } from '@/components/ui/alert';
import { AlertTriangle, ChevronRight } from 'lucide-react';
import NotFound from '@/pages/general/NotFound';
import { CALENDAR_ROUTE_PREFIXES } from '@meditime/constants';
import type {
  CalendarPageSourceType,
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

  let calendarType: CalendarPageSourceType = 'personal';
    let calendarId = params.calendarId;
    let basePath = 'calendar';
  
    const pathWithoutLang =
      location.pathname.replace(/^\/[a-z]{2}(?=\/|$)/, '') || '/';
  
    if (pathWithoutLang.startsWith(CALENDAR_ROUTE_PREFIXES.SHARED_USER)) {
      calendarType = 'sharedUser';
      calendarId = params.calendarId;
      basePath = 'shared-user-calendar';
    } else if (pathWithoutLang.startsWith(CALENDAR_ROUTE_PREFIXES.SHARED_TOKEN)) {
      calendarType = 'token';
      calendarId = params.sharedToken;
      basePath = 'shared-token-calendar';
    }
  
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
    const onWeekSelect = async (newSelectedDate: Date) => {
      onSelectDate(newSelectedDate);
      const isoDate = toISO(newSelectedDate);
      const rep = await calendarSource.fetchSchedule(calendarId, isoDate);
      if (rep.success) {
        setCalendarEvents((rep.schedule as WeeklyEventItem[]) || []);
        setCalendarTable(rep.table || {});
      }
    };
  
    // Fonction pour naviguer vers la date suivante ou precedente
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
      const newSelectedDate = current;
      void onWeekSelect(newSelectedDate);
    };
  
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

    useEffect(() => {
      if (!selectedDate || !calendarEvents.length) return;
      // Copier avant de trier pour éviter de muter le tableau d'état `calendarEvents`
      const sortedEvents = [...calendarEvents].sort((a, b) => {
        const dateA = new Date(a.start);
        const dateB = new Date(b.start);
        if (dateA.getTime() === dateB.getTime()) {
          return a.title.localeCompare(b.title);
        }
        return dateA.getTime() - dateB.getTime();
      });
      const filtered = sortedEvents.filter((event) =>
        event.start.startsWith(toISO(selectedDate))
      );
      setEventsForDay(filtered);
    }, [selectedDate, calendarEvents]);

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
        <Link
          className="block w-full"
          to={`/${params.lng || 'fr'}/${basePath}/${calendarId}/stock-alerts`}
          title={t('stock_alert_tooltip')}
          aria-label={t('stock_alert')}
        >
          <Alert className="flex items-center justify-between bg-yellow-50 border-yellow-200 hover:bg-yellow-100 transition cursor-pointer">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              <span className="font-semibold text-yellow-900">{t('stock_alert')}</span>
            </div>
            <ChevronRight className="h-5 w-5 text-yellow-600" />
          </Alert>
        </Link>
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
