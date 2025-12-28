// CalendarPage.jsx
import React, { useEffect, useContext, useRef, useState, useMemo } from 'react';
import { useNavigate, useParams, useLocation, Link } from 'react-router-dom';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { useTranslation } from 'react-i18next';
import { UserContext } from '@/contexts/UserContext';
import { useLoading } from '@/components/ui/loading';
import { toISO } from '@/utils/calendar/dateUtils';
import { getCalendarSourceMap } from '@/utils/calendar/calendarSourceMap';
import { useAlert } from '@/contexts/AlertContext';
import isEqual from 'lodash/isEqual';
import DateModal from '@/components/calendar/DateModal';
import WeekCalendarSelector from '@/components/calendar/WeekCalendarSelector';
import WeeklyEventContent from '@/components/calendar/WeeklyEventContent';
import PillboxDisplay from '@/components/calendar/PillboxDisplay';
import ActionSheet from '@/components/common/ActionSheet';
import NotFound from '@/pages/general/NotFound.jsx';
import PropTypes from 'prop-types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Pill, Grid3X3, CalendarDays, Share2, Download, AlertTriangle, Calendar, Clock, Settings, Trash2, ChevronRight, Pin } from 'lucide-react';
import '@/styles/fullcalendar-custom.css';
import { Calendar as CalendarSelector } from '@/components/ui/calendar';


function CalendarPage({
  personalCalendars,
  sharedUserCalendars,
  tokenCalendars,
}) {
  // 📍 Paramètres d'URL et navigation
  const navigate = useNavigate(); // Hook de navigation
  const location = useLocation();
  const params = useParams();
  const { lng } = params;
  const { t } = useTranslation();

  // 🔐 Contexte d'authentification
  const { userInfo } = useContext(UserContext); // Contexte de l'utilisateur connecté
  const { showLoading } = useLoading(); // Gestion du spinner global

  const calendarRef = useRef(null);
  // garder selectedDate comme objet Date pour manipulations faciles
  const [selectedDate, setSelectedDate] = useState(); // Date JS
  const [eventsForDay, setEventsForDay] = useState([]); // Événements filtrés pour un jour spécifique
  const [calendarEvents, setCalendarEvents] = useState([]); // Événements du calendrier
  const [calendarTable, setCalendarTable] = useState([]); // Événements du calendrier
  const [calendarName, setCalendarName] = useState(''); // Nom du calendrier
  const [isLowStock, setIsLowStock] = useState(false); // Indicateur de stock faible
  const { showConfirm } = useAlert();

  // Méthode de décrémentation du stock (pour affichage différencié)
  const [stockDecrementMethod, setStockDecrementMethod] = useState(false);
  const [loadingStockMethod, setLoadingStockMethod] = useState(false);

  // 🔄 Références et chargement
  const dateModalRef = useRef(null);
  const [loading, setLoading] = useState(true); // État de chargement du calendrier
  const [notFound, setNotFound] = useState(false);
  const initialNextDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).setHours(0,0,0,0);
  
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
  const onWeekSelect = async (newSelectedDate) => {
    onSelectDate(newSelectedDate);
    const isoDate = toISO(newSelectedDate);
    const rep = await calendarSource.fetchSchedule(calendarId, isoDate);
    if (rep.success) {
      setCalendarEvents(rep.schedule);
      setCalendarTable(rep.table);
      calendarRef.current?.getApi().gotoDate(isoDate);
    }
  };

  // Fonction pour gérer le clic sur une date
  const handleDateClick = (info) => {
    const clickedDate = info.dateStr; // YYYY-MM-DD
    setSelectedDate(new Date(clickedDate));
    dateModalRef.current?.open();
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
    if (!calendarId) return setLoading(false);
    if (!selectedDate) return 
    if (calendarType === 'personal' || calendarType === 'sharedUser') {
      if (!userInfo) return setLoading(true);
    }
    const load = async () => {
      const rep = await calendarSource.fetchSchedule(calendarId, toISO(selectedDate));
      if (rep.success) {
        if (!isEqual(rep.schedule, calendarEvents)) {
          setCalendarEvents(rep.schedule);
        }
        if (!isEqual(rep.table, calendarTable)) {
          setCalendarTable(rep.table);
        }
        if (!isEqual(rep.calendarName, calendarName)) {
          setCalendarName(rep.calendarName);
        }
        if (rep.ifLowStock !== undefined && rep.ifLowStock !== isLowStock) {
          setIsLowStock(rep.ifLowStock);
          // TODO: Hook pour alerte stock faible en temps réel
        }
      } else {;
        // Si l'API retourne un 404, le calendrier n'existe pas
        if (rep.status === 404) {
          setNotFound(true);
        }
      }
      setLoading(false);
    };

    load();
  }, [calendarId, calendarSource.fetchSchedule, userInfo, selectedDate]);

  // Gérer l'affichage du spinner global
  useEffect(() => {
    showLoading(((loading === true || loadingStockMethod === true) && calendarId), t('loading_calendar'));
  }, [loading, loadingStockMethod, calendarId, showLoading, t]);

  // Charger la méthode de décrémentation du stock (si disponible)
  useEffect(() => {
    const fetchMethod = async () => {
      if (!calendarId) return setLoadingStockMethod(false);
      if (calendarType === 'personal' || calendarType === 'sharedUser') {
        if (!userInfo) return setLoadingStockMethod(true);
      }
      // On tente pour les calendriers personal et sharedUser en appelant l'API exposée
      const rep = await calendarSource.fetchStockDecrementMethod(calendarId);
      if (rep.success) {
        setStockDecrementMethod(rep.method);
      } else if (rep.status === 404) {
        setNotFound(true);
        setSelectedDate(new Date().setHours(0,0,0,0));
      }
      setLoadingStockMethod(false);
    };
    fetchMethod();
  }, [calendarId, calendarType, userInfo]);

  // Si la méthode est weekly_pillbox et que l'utilisateur n'a pas choisi
  // explicitement une date (on est encore sur aujourd'hui), on bascule
  // la sélection sur le lundi initial (semaine suivante). Simple et non intrusif.
  // Ce useEffect ne se déclenche qu'une fois lors du chargement de stockDecrementMethod
  useEffect(() => {
    if (!stockDecrementMethod) return;
    if (!selectedDate) {
      if (stockDecrementMethod == 'weekly_pillbox') {
        setSelectedDate(initialNextDate);
      } else {
        setSelectedDate(new Date().setHours(0,0,0,0));
      }
    }
  }, [stockDecrementMethod, initialNextDate, selectedDate]);

  // Fonction pour supprimer le calendrier avec confirmation
  const handleDeleteCalendar = () => {
    showConfirm(
      'confirm-danger',
      t('calendar.delete_title'),
      t('calendar.delete_description'),
      async () => {
        const rep = await personalCalendars.deleteCalendar(calendarId);
        if (rep.success) {
          navigate(`/${lng}/calendars`);
        }
      }
    );
  };

  // Fonction pour supprimer un calendrier partagé avec confirmation
  const handleDeleteSharedCalendar = () => {
    showConfirm(
      'confirm-danger',
      t('calendar.delete_shared_title'),
      t('calendar.delete_shared_description'),
      async () => {
        const rep = await sharedUserCalendars.deleteSharedCalendar(calendarId);
        if (rep.success) {
          navigate(`/${lng}/calendars`);
        }
      }
    );
  };


  // 📍 Filtrage des événements pour un jour spécifique et tri par ordre alphabétique
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

  // 📍 Mémoisation des événements pour le calendrier
  const memoizedEvents = useMemo(() => {
    return calendarEvents.map((event) => ({
      title: `${event.title} ${event.dose != null ? `${event.dose} mg` : ''} (${event.tablet_count})`,
      start: event.start,
      color: event.color,
    }));
  }, [calendarEvents]);

  // Affichage de la page 404 si le calendrier n'existe pas
  if (notFound) {
    return <NotFound />;
  }

  return (
    <>

      <div className="container mx-auto mt-2">
        <div className="flex flex-wrap justify-center">
          <div className="w-full lg:w-1/3 mb-2 lg:px-2">
            <div className="mb-3">
              {/* Boutons de navigation et partage */}
              <div className="flex items-center gap-2 mb-3">
                {/* Bouton Médicaments qui prend tout l'espace dispo */}
                <Button
                  asChild
                  variant="outline"
                  className="grow mr-auto gap-2"
                  aria-label={t('medicines.label')}
                  title={t('medicines.label')}
                  data-tour="nav-medicines-btn"
                >
                  <Link to={`/${lng}/${basePath}/${calendarId}/boxes`}>
                    <Pill className="h-4 w-4" />
                    <span>{t('medicines.label')}</span>
                  </Link>
                </Button>

                {/* Bouton pour afficher le menu déroulant */}
                {calendarType === 'personal' && (
                  <ActionSheet
                    dataTour="calendar-actions-btn"
                    actions={[
                      // view toggle actions
                      {
                        label: (
                          <>
                            <Grid3X3 className="h-4 w-4 mr-2" /> {t('pillbox.title')}
                          </>
                        ),
                        linkTo: `/${lng}/${basePath}/${calendarId}/pillbox?date=${toISO(selectedDate)}`,
                        title: t('pillbox.title'),
                      },
                      {
                        label: (
                          <>
                            <CalendarDays className="h-4 w-4 mr-2" /> {t('day_view.title')}
                          </>
                        ),
                        linkTo: `/${lng}/${basePath}/${calendarId}/daily?date=${toISO(new Date().setHours(0,0,0,0))}`,
                        title: t('day_view.title'),
                      },
                      { separator: true },
                      {
                        label: (
                          <>
                            <Share2 className="h-4 w-4 mr-2" /> {t('share')}
                          </>
                        ),
                        linkTo: `/${lng}/shared-calendars?calendar=${calendarId}`,
                        title: t('share'),
                        dataTour: 'share-calendar-btn',
                      },
                      { separator: true },
                      {
                        label: (
                          <>
                            <Download className="h-4 w-4 mr-2" /> {t('boxes.export_pdf')}
                          </>
                        ),
                        onClick: () => calendarSource.downloadCalendarPdf(calendarId),
                        title: t('boxes.export_pdf'),
                        dataTour: 'export-pdf-btn',
                      },
                      {
                        label: (
                          <>
                            <AlertTriangle className="h-4 w-4 mr-2" /> {t('stock')}
                          </>
                        ),
                        linkTo: `/${lng}/${basePath}/${calendarId}/stock-alerts`,
                        title: t('stock'),
                        dataTour: 'stock-alerts-btn',
                      },
                      {
                        label: (
                          <>
                            <Calendar className="h-4 w-4 mr-2" /> {t('ics.calendar_ics')}
                          </>
                        ),
                        linkTo: `/${lng}/${basePath}/${calendarId}/ics-tokens`,
                        title: t('ics.calendar_ics'),
                      },
                      {
                        label: (
                          <>
                            <Clock className="h-4 w-4 mr-2" /> {t('pillbox_uses')}
                          </>
                        ),
                        linkTo: `/${lng}/${basePath}/${calendarId}/pillbox-uses`,
                        title: t('pillbox_uses'),
                        dataTour: 'pillbox-history-btn',
                      },
                      { separator: true },
                      {
                        label: (
                          <>
                            <Settings className="h-4 w-4 mr-2" /> {t('settings.label')}
                          </>
                        ),
                        linkTo: `/${lng}/${basePath}/${calendarId}/settings`,
                        title: t('settings.label'),
                        dataTour: 'calendar-settings-btn',
                      },
                      { separator: true },
                      {
                        label: (
                          <>
                            <Trash2 className="h-4 w-4 mr-2" /> {t('delete')}
                          </>
                        ),
                        onClick: handleDeleteCalendar,
                        title: t('delete'),
                        danger: true,
                      },
                    ]}
                  />
                )}
                {calendarType === 'sharedUser' && (
                  <ActionSheet
                    actions={[
                      // view toggle for shared users too
                      {
                        label: (
                          <>
                            <Grid3X3 className="h-4 w-4 mr-2" /> {t('pillbox.title')}
                          </>
                        ),
                        linkTo: `/${lng}/${basePath}/${calendarId}/pillbox?date=${toISO(selectedDate)}`,
                        title: t('pillbox.title'),
                      },
                      {
                        label: (
                          <>
                            <CalendarDays className="h-4 w-4 mr-2" /> {t('day_view.title')}
                          </>
                        ),
                        linkTo: `/${lng}/${basePath}/${calendarId}/daily?date=${toISO(new Date().setHours(0,0,0,0))}`,
                        title: t('day_view.title'),
                      },
                      { separator: true },
                      {
                        label: (
                          <>
                            <Download className="h-4 w-4 mr-2" /> {t('boxes.export_pdf')}
                          </>
                        ),
                        onClick: () => calendarSource.downloadCalendarPdf(calendarId),
                        title: t('boxes.export_pdf'),
                      },
                      {
                        label: (
                          <>
                            <Calendar className="h-4 w-4 mr-2" /> {t('ics.calendar_ics')}
                          </>
                        ),
                        linkTo: `/${lng}/${basePath}/${calendarId}/ics-tokens`,
                        title: t('ics.calendar_ics'),
                      },
                      {
                        label: (
                          <>
                            <Clock className="h-4 w-4 mr-2" /> {t('pillbox_uses')}
                          </>
                        ),
                        linkTo: `/${lng}/${basePath}/${calendarId}/pillbox-uses`,
                        title: t('pillbox_uses'),
                      },
                      { separator: true },
                      {
                        label: (
                          <>
                            <Settings className="h-4 w-4 mr-2" /> {t('settings.label')}
                          </>
                        ),
                        linkTo: `/${lng}/${basePath}/${calendarId}/settings`,
                        title: t('settings.label'),},
                      { separator: true },
                      {
                        label: (
                          <>
                            <Trash2 className="h-4 w-4 mr-2" /> {t('delete')}
                          </>
                        ),
                        onClick: handleDeleteSharedCalendar,
                        title: t('delete'),
                        danger: true,
                      },
                    ]}
                  />
                )}
              </div>
              {/* Affichage alert stock */}
              {isLowStock && (
                <Link
                  className="flex items-center justify-between w-full px-3 py-2 rounded-md bg-yellow-500/15 border border-yellow-500/50 text-foreground no-underline shadow"
                  to={`/${lng}/${basePath}/${calendarId}/stock-alerts`}
                  title={t('stock_alert_tooltip')}
                  aria-label={t('stock_alert')}
                >
                  <div className="flex items-center">
                    <AlertTriangle className="h-5 w-5 mr-2 text-yellow-600" />
                    <span className="font-semibold">{t('stock_alert')}</span>
                  </div>
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Link>
              )}

            </div>
                            <CalendarSelector
                  mode="single"
                  selected={selectedDate || new Date()}
                  onSelect={onWeekSelect}
                  locale={t('locale')}
                  showOutsideDays
                />
            {/* Bouton pour naviguer vers la semaine suivante ou precedente */}
            {stockDecrementMethod === "weekly_pillbox" && (
              <div className='flex lg:hidden justify-center items-center' data-tour="calendar-week-selector">
                <CalendarWeekSelector
                  calendarTable={calendarTable}
                  onWeekSelect={onWeekSelect}
                  selectedDate={selectedDate}
                  t={t}
                />
              </div>
            )}
            <div className='hidden lg:flex justify-center items-center' data-tour="calendar-week-selector">
              <CalendarWeekSelector
                calendarTable={calendarTable}
                onWeekSelect={onWeekSelect}
                selectedDate={selectedDate}
                t={t}
              />
            </div>
          </div>

          {/* Pilulier */}
          {Object.keys(calendarTable).filter((key) => calendarTable[key].length > 0)
          .length > 0 && (
            <>
              {/* Pilulier - Vue mobile */}
              {stockDecrementMethod === "weekly_pillbox" && (
                <div className="block lg:hidden w-full lg:w-2/3 lg:px-2">
                  <div>
                    <h4 className="mb-3 font-bold flex items-center gap-2">
                      <Pill className="h-5 w-5" /> {t('pillbox.title')}
                    </h4>
                    <Button
                      asChild
                      variant="outline"
                      className="w-full gap-2"
                      aria-label={t('pillbox.fill')}
                      title={t('pillbox.fill')}
                      data-tour="calendar-grid-mobile-btn"
                    >
                      <Link to={`/${lng}/${basePath}/${calendarId}/pillbox?date=${toISO(selectedDate)}`}>
                        <Pill className="h-4 w-4" /> {t('pillbox.fill')}
                      </Link>
                    </Button>
                  </div>
                </div>
              )}

              {/* Pilulier - Vue desktop */}
              <div className="hidden lg:block w-full lg:w-2/3 mb-4 lg:px-2" data-tour="calendar-grid-desktop">
                <h4 className="mb-3 font-bold flex items-center gap-2">
                  <Pill className="h-5 w-5" /> {t('pillbox.title')}
                </h4>
                <Card className="shadow p-1">
                  <CardContent className="pb-3 p-1">
                    <PillboxDisplay
                      type="calendar"
                      selectedDate={selectedDate}
                      calendarType={calendarType}
                      calendarId={calendarId}
                      basePath={basePath}
                      personalCalendars={personalCalendars}
                      sharedUserCalendars={sharedUserCalendars}
                      tokenCalendars={tokenCalendars}
                      setNotFound={setNotFound}
                    />
                  </CardContent>
                </Card>
              </div>
            </>
          )}

          {/* Tableau hebdomadaire */}
          {/*
          {Object.keys(calendarTable).filter(
            (key) => calendarTable[key].length > 0
          ).length > 0 && (
            <div className="col-12 col-lg-8 mb-4">
              <div className="mb-2">
                <h4 className="mb-3 fw-bold">
                  <i className="bi bi-table"></i> Tableau hebdomadaire
                </h4>
                {/*trier matin, midi, soir et supprimer les moments non présents
                {Object.keys(calendarTable)
                  .sort((a, b) => {
                    const order = ['morning', 'noon', 'evening'];
                    return order.indexOf(a) - order.indexOf(b);
                  })
                  .filter((moment) => calendarTable[moment].length > 0)
                  .map((moment, index) => (
                    <div key={moment}>
                      <h5 className="mb-3 fw-semibold">
                        <i className="bi bi-clock-fill"></i>{' '}
                        {moment_map[moment]}
                      </h5>
                      {calendarTable[moment].map((table, index) => (
                        <div
                          className="card border border-secondary-subtle mb-2 shadow-sm"
                          key={index}
                        >
                          <div className="card-header bg-light fw-semibold text-dark">
                            <i className="bi bi-capsule me-2"></i>
                            {table.title}{' '}
                            {table.dose != null ? `${table.dose} mg` : ''}
                          </div>
                          <div className="card-body p-0">
                            <div className="table-responsive">
                              <table className="table table-sm table-bordered text-center align-middle mb-0 table-striped">
                                <thead className="table-light">
                                  <tr>
                                    {days.map((day) => (
                                      <th key={day}>{days_map[day]}</th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody>
                                  <tr>
                                    {days.map((day) => (
                                      <td key={day}>
                                        {table.cells[day] && (
                                          <span className="text-muted small px-2 py-1 rounded d-inline-block">
                                            {table.cells[day]}
                                          </span>
                                        )}
                                      </td>
                                    ))}
                                  </tr>
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </div>
                      ))}
                      {index <
                        Object.keys(calendarTable).filter(
                          (key) => calendarTable[key].length > 0
                        ).length -
                          1 && <hr className="mt-4 shadow-sm" />}
                    </div>
                  ))}
              </div>
            </div>
          )}*/}
        </div>
      </div>


      {/* Calendrier par semaine */}
      {Object.keys(calendarTable).filter((key) => calendarTable[key].length > 0)
        .length > 0 ? (
        <div className="container mx-auto mt-4">
          {/* Calendrier mensuel */}
          <div className="hidden lg:block">
            <h4 className="mb-3 font-bold flex items-center gap-2">
              <CalendarDays className="h-5 w-5" /> {t('calendar.weekly_view')}
            </h4>
            <Card className="shadow">
              <CardContent>
                <Alert>
                  <Pin/>
                  <AlertDescription>{t('calendar.weekly_help')}</AlertDescription>
                </Alert>
                <FullCalendar
                  /* Force le recalcul de l'instance quand la date sélectionnée change */
                  key={selectedDate ? toISO(selectedDate) : 'calendar'}
                  ref={calendarRef}
                  plugins={[dayGridPlugin, interactionPlugin]}
                  initialView="dayGridWeek"
                  /* Date initiale correcte au montage */
                  initialDate={selectedDate || new Date()}
                  events={memoizedEvents}
                  headerToolbar={{
                    left: '',
                    center: '',
                    right: '',
                  }}
                  locale={t('locale')}
                  firstDay={1}
                  dateClick={handleDateClick}
                  height="auto"
                  // click sur les événements
                  eventClick={(info) => {
                    const clickedDate = info.event.startStr.slice(0, 10); // format YYYY-MM-DD
                    handleDateClick({ dateStr: clickedDate });
                  }}
                  buttonText={{
                    today: t('calendar.today'),
                    month: t('calendar.month'),
                    week: t('calendar.week'),
                    day: t('calendar.day'),
                  }}
                />
              </CardContent>
            </Card>

            {/* Modal pour afficher les médicaments d'une date */}
            <DateModal
              ref={dateModalRef}
              selectedDate={selectedDate}
              eventsForDay={eventsForDay}
              onNext={() => navigateDay(1)}
              onPrev={() => navigateDay(-1)}
              onSelectDate={onSelectDate}
              getPastWeek={() => navigateWeek(-1)}
              getNextWeek={() => navigateWeek(1)}
            />
          </div>

          {/* Calendrier - Vue mobile uniquement */}
          {stockDecrementMethod  === "daily_midnight" && (
            <div className="block lg:hidden">
              <h4 className="mb-3 font-bold flex items-center gap-2">
                <CalendarDays className="h-5 w-5" /> {t('calendar.daily_view')}
              </h4>

              <Card className="shadow">
                <CardContent className="p-2">
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
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      ) : (
        <Alert className="mt-4 mb-0">
          <Pin className="h-4 w-4" />
          <AlertDescription>{t('no_medicines')}</AlertDescription>
        </Alert>
      )}
    </>
  );
}

function CalendarWeekSelector({
  calendarTable,
  onWeekSelect,
  selectedDate,
  t
}) {
  return (
    Object.keys(calendarTable).filter(
      (key) => calendarTable[key].length > 0
    ).length > 0 && (
      <div className="mb-2 w-full">
        <h4 className="mb-3 font-bold flex items-center gap-2">
          <CalendarDays className="h-5 w-5" /> {t('calendar.reference_week')}
        </h4>
        <Card className="shadow rounded-lg w-full p-0">
          <CardContent className="p-0">
            <div className="h-full overflow-auto">
              <WeekCalendarSelector onWeekSelect={onWeekSelect} selectedDate={selectedDate} />
            </div>
          </CardContent>
        </Card>
      </div>
    )
  )
}

CalendarPage.propTypes = {
  personalCalendars: PropTypes.shape({
    deletePersonalCalendar: PropTypes.func,
  }),
  sharedUserCalendars: PropTypes.shape({
    deleteSharedCalendar: PropTypes.func,
  }),
  tokenCalendars: PropTypes.object,
};

export default CalendarPage;
