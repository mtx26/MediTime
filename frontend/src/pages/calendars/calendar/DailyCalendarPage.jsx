
import React, { useRef, useState, useEffect, useContext } from 'react';
import { useParams, useLocation, useNavigate, Link } from 'react-router-dom';
import { useLoading } from '@/components/ui/loading';
import WeeklyEventContent from '@/components/calendar/WeeklyEventContent';
import { toISO, toDate, getMondayDate } from '@/utils/calendar/dateUtils';
import { getCalendarSourceMap } from '@/utils/calendar/calendarSourceMap';
import { UserContext } from '@/contexts/UserContext';
import { useTranslation } from 'react-i18next';
import isEqual from 'lodash/isEqual';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, ChevronRight } from 'lucide-react';
import NotFound from '../general/NotFound';

// Page d'affichage du mode "daily" (journalier)

export default function DailyCalendarPage({ personalCalendars, sharedUserCalendars, tokenCalendars }) {
  const navigate = useNavigate(); // Hook de navigation
  const location = useLocation();
  const params = useParams();
  const { t } = useTranslation();
  const today = new Date().setHours(0,0,0,0);

  const selectedDateParam = new URLSearchParams(location.search).get('date') || today; // Date sélectionnée en paramètre ou aujourd'hui par défaut

  // 🔐 Contexte d'authentification
  const { userInfo } = useContext(UserContext); // Contexte de l'utilisateur connecté

  const calendarRef = useRef(null);
  // garder selectedDate comme objet Date pour manipulations faciles
  const [selectedDate, setSelectedDate] = useState(); // Date JS

  useEffect(() => {
  if (selectedDateParam) {
    const parsedDate = toDate(selectedDateParam);
    setSelectedDate(parsedDate);
  } else {
    setSelectedDate(new Date().setHours(0,0,0,0));
  }
}, [selectedDateParam]);

  const [eventsForDay, setEventsForDay] = useState([]); // Événements filtrés pour un jour spécifique
  const [calendarEvents, setCalendarEvents] = useState([]); // Événements du calendrier
  const [calendarTable, setCalendarTable] = useState([]); // Événements du calendrier
  const [isLowStock, setIsLowStock] = useState(false); // Indicateur de stock faible
  // Méthode de décrémentation du stock (pour affichage différencié)

  // 🔄 Références et chargement
  const [loading, setLoading] = useState(true); // État de chargement du calendrier
  const [notFound, setNotFound] = useState(false); // Erreur 404 si le calendrier n'existe pas

	  let calendarType = 'personal';
    let calendarId = params.calendarId;
    let basePath = 'calendar';
  
    const pathWithoutLang =
      location.pathname.replace(/^\/[a-z]{2}(?=\/|$)/, '') || '/';
  
    if (pathWithoutLang.startsWith('/shared-user-calendar')) {
      calendarType = 'sharedUser';
      calendarId = params.calendarId;
      basePath = 'shared-user-calendar';
    } else if (pathWithoutLang.startsWith('/shared-token-calendar')) {
      calendarType = 'token';
      calendarId = params.sharedToken;
      basePath = 'shared-token-calendar';
    }
  
    const calendarSource = getCalendarSourceMap(
      personalCalendars,
      sharedUserCalendars,
      tokenCalendars
    )[calendarType];
  
    // Fonction pour naviguer vers une date
    const onSelectDate = (dateInput) => {
      // accepte Date ou ISO string
      const d = dateInput instanceof Date ? dateInput : new Date(dateInput);
      setSelectedDate(d);
      setEventsForDay(calendarEvents.filter((e) => e.start.startsWith(toISO(d))));
    };
  
    // Fonction pour naviguer vers la semaine suivante ou precedente
    // accepte un second argument optionnel `desiredSelectedDate` (ISO string)
    // pour préserver le jour sélectionné lors du changement de semaine.
    const onWeekSelect = async (newSelectedDate) => {
      onSelectDate(newSelectedDate);
      const isoDate = toISO(newSelectedDate);
      const rep = await calendarSource.fetchSchedule(calendarId, isoDate);
      if (rep.success) {
        setCalendarEvents(rep.schedule);
        setCalendarTable(rep.table);
      }
    };
  
    // Fonction pour naviguer vers la date suivante ou precedente
    const navigateDay = (direction) => {
      const current = new Date(selectedDate);
      current.setDate(current.getDate() + direction);
      setSelectedDate(current);
    };
  
    const navigateWeek = (direction) => {
      const current = new Date(selectedDate);
      current.setDate(current.getDate() + direction);
      const newSelectedDate = current;
      onWeekSelect(newSelectedDate);
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
          if (!isEqual(rep.schedule, calendarEvents)) {
            setCalendarEvents(rep.schedule);
          }
          if (!isEqual(rep.table, calendarTable)) {
            setCalendarTable(rep.table);
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
  
      load();
    }, [calendarId, calendarSource.fetchSchedule, userInfo, selectedDate]);

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
    // Ne pas afficher le spinner si le calendrier n'existe pas (404)
    if (notFound) {
      showLoading(false);
      return;
    }
    showLoading(loading === true && calendarId, t('calendar.loading_daily_view'));
  }, [loading, calendarId, showLoading, t, notFound]);

  if (loading === true && calendarId) {
    return null;
  }

  // Affichage de la page 404 si le calendrier n'existe pas
  if (notFound && calendarId) {
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
