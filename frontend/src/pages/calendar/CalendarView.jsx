// CalendarPage.jsx
import React, { useEffect, useContext, useRef, useState, useMemo } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { useTranslation } from 'react-i18next';
import { UserContext } from '../../contexts/UserContext';
import { toISO } from '../../utils/calendar/dateUtils';
import { getCalendarSourceMap } from '../../utils/calendar/calendarSourceMap';
import AlertSystem from '../../components/common/AlertSystem';
import isEqual from 'lodash/isEqual';
import bootstrap5Plugin from '@fullcalendar/bootstrap5';
import DateModal from '../../components/calendar/DateModal';
import WeekCalendarSelector from '../../components/calendar/WeekCalendarSelector';
import WeeklyEventContent from '../../components/calendar/WeeklyEventContent';
import PillboxDisplay from '../../components/calendar/PillboxDisplay';
import ActionSheet from '../../components/common/ActionSheet';

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

  const calendarRef = useRef(null);
  // garder selectedDate comme objet Date pour manipulations faciles
  const [selectedDate, setSelectedDate] = useState(); // Date JS
  const [eventsForDay, setEventsForDay] = useState([]); // Événements filtrés pour un jour spécifique
  const [calendarEvents, setCalendarEvents] = useState([]); // Événements du calendrier
  const [calendarTable, setCalendarTable] = useState([]); // Événements du calendrier
  const [calendarName, setCalendarName] = useState(''); // Nom du calendrier
  const [isLowStock, setIsLowStock] = useState(false); // Indicateur de stock faible
  const [alertType, setAlertType] = useState(''); // Type d'alerte
  const [alertMessage, setAlertMessage] = useState(''); // Message d'alerte
  // Méthode de décrémentation du stock (pour affichage différencié)
  const [stockDecrementMethod, setStockDecrementMethod] = useState('');
  const [loadingStockMethod, setLoadingStockMethod] = useState(false);

  // 🔄 Références et chargement
  const dateModalRef = useRef(null);
  const [loading, setLoading] = useState(true); // État de chargement du calendrier
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
    if (!calendarId) return setLoading(true);
    if (!selectedDate) return setLoading(true);
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
      }
      setLoading(rep.success ? false : undefined);
    };

    load();
  }, [calendarId, calendarSource.fetchSchedule, userInfo, selectedDate]);

  // Charger la méthode de décrémentation du stock (si disponible)
  useEffect(() => {
    const fetchMethod = async () => {
      if (!calendarId) return setLoadingStockMethod(false);
      if (calendarType === 'personal' || calendarType === 'sharedUser') {
        if (!userInfo) return setLoading(true);
      }
      // On tente pour les calendriers personal et sharedUser en appelant l'API exposée
      const rep = await calendarSource.fetchStockDecrementMethod(calendarId);
      if (rep.success) {
        setStockDecrementMethod(rep.method);
      }
      setLoadingStockMethod((rep.success ? false : undefined));
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

  if (loading === true && calendarId) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ height: '60vh' }}
      >
        <div className="spinner-border text-primary">
          <span className="visually-hidden">{t('loading_calendar')}</span>
        </div>
      </div>
    );
  }

  if ((loading === undefined || loadingStockMethod) && calendarId) {
    return (
      <div className="alert alert-danger text-center mt-5" role="alert">
        ❌ {t('invalid_or_expired_link')}
      </div>
    );
  }

  return (
    <>

      <div className="container mt-2">
        <div className="row justify-content-center">
          <div className="col-12 col-lg-4 mb-2">
            <div className="mb-3">
              {/* Alert system */}
              <AlertSystem
                type={alertType}
                message={alertMessage}
                onClose={() => {
                  setAlertMessage('');
                }}
              />
              {/* Boutons de navigation et partage */}
              <div className="d-flex align-items-center gap-2 mb-3">
                {/* Bouton Médicaments qui prend tout l'espace dispo */}
                <button
                  className="btn btn-outline-secondary flex-grow-1 me-auto"
                  onClick={() => navigate(`/${lng}/${basePath}/${calendarId}/boxes`)}
                  aria-label={t('medicines.label')}
                  title={t('medicines.label')}
                >
                  <i className="bi bi-capsule"></i>
                  <span> {t('medicines.label')}</span>
                </button>

                {/* Bouton pour afficher le menu déroulant */}
                {calendarType === 'personal' && (
                  <ActionSheet
                    actions={[
                      // view toggle actions
                      {
                        label: (
                          <>
                            <i className="bi bi-grid-3x3-gap me-2" /> {t('pillbox.title')}
                          </>
                        ),
                        onClick: () => navigate(`/${lng}/${basePath}/${calendarId}/pillbox?date=${toISO(selectedDate)}`),
                      },
                      {
                        label: (
                          <>
                            <i className="bi bi-calendar-day me-2" /> {t('day_view.title')}
                          </>
                        ),
                        onClick: () => navigate(`/${lng}/${basePath}/${calendarId}/daily?date=${toISO(new Date().setHours(0,0,0,0))}`),
                      },
                      { separator: true },
                      {
                        label: (
                          <>
                            <i className="bi bi-box-arrow-up me-2" /> {t('share')}
                          </>
                        ),
                        onClick: () =>
                          navigate(`/${lng}/shared-calendars?calendar=${calendarId}`),
                      },
                      { separator: true },
                      {
                        label: (
                          <>
                            <i className="bi bi-download me-2" /> {t('boxes.export_pdf')}
                          </>
                        ),
                        onClick: () => calendarSource.downloadCalendarPdf(calendarId),
                      },
                      {
                        label: (
                          <>
                            <i className="bi bi-exclamation-triangle me-2" /> {t('stock')}
                          </>
                        ),
                        onClick: () =>
                          navigate(`/${lng}/${basePath}/${calendarId}/stock-alerts`),
                      },
                      { separator: true },
                      {
                        label: (
                          <>
                            <i className="bi bi-gear me-2" /> {t('settings.label')}
                          </>
                        ),
                        onClick: () =>
                          navigate(`/${lng}/${basePath}/${calendarId}/settings`),
                      },
                      { separator: true },
                      {
                        label: (
                          <>
                            <i className="bi bi-trash me-2" /> {t('delete')}
                          </>
                        ),
                        onClick: async () => {
                          const rep = await personalCalendars.deleteCalendar(calendarId);
                          if (rep.success) {
                            navigate(`/${lng}/calendars`);
                          } else {
                            setAlertType('danger');
                            setAlertMessage(rep.error);
                          }
                        },
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
                            <i className="bi bi-grid-3x3-gap me-2" /> {t('pillbox.title')}
                          </>
                        ),
                        onClick: () => navigate(`/${lng}/${basePath}/${calendarId}/pillbox?date=${toISO(selectedDate)}`),
                      },
                      {
                        label: (
                          <>
                            <i className="bi bi-calendar-day me-2" /> {t('day_view.title')}
                          </>
                        ),
                        onClick: () => navigate(`/${lng}/${basePath}/${calendarId}/daily?date=${toISO(new Date().setHours(0,0,0,0))}`),
                      },
                      { separator: true },
                      {
                        label: (
                          <>
                            <i className="bi bi-download me-2" /> {t('boxes.export_pdf')}
                          </>
                        ),
                        onClick: () => calendarSource.downloadCalendarPdf(calendarId),
                      },
                      { separator: true },
                      {
                        label: (
                          <>
                            <i className="bi bi-gear me-2" /> {t('settings.label')}
                          </>
                        ),
                        onClick: () =>
                          navigate(`/${lng}/${basePath}/${calendarId}/settings`),
                      },
                      { separator: true },
                      {
                        label: (
                          <>
                            <i className="bi bi-trash3 me-2"></i> {t('delete')}
                          </>
                        ),
                        onClick: () => sharedUserCalendars.deleteSharedCalendar(calendarId),
                        danger: true,
                      },
                    ]}
                  />
                )}
              </div>
              {/* Affichage alert stock */}
              {isLowStock && (
                <button
                  type="button"
                  className="alert w-100 alert-warning d-flex align-items-center justify-content-between px-3 py-2 shadow"
                  onClick={() =>
                    navigate(`/${lng}/${basePath}/${calendarId}/stock-alerts`)}
                  title={t('stock_alert_tooltip')}
                  aria-label={t('stock_alert')}
                >
                  <div className="d-flex align-items-center">
                    <i className="bi bi-exclamation-triangle-fill me-2 fs-5"></i>
                    <span className="fw-semibold">{t('stock_alert')}</span>
                  </div>
                  <i className="bi bi-chevron-right ms-2"></i>
                </button>
              )}

            </div>
            {/* Bouton pour naviguer vers la semaine suivante ou precedente */}
            {stockDecrementMethod === "weekly_pillbox" && (
              <div className='d-flex d-lg-none justify-content-center align-items-center'>
                <CalendarWeekSelector
                  calendarTable={calendarTable}
                  onWeekSelect={onWeekSelect}
                  selectedDate={selectedDate}
                  t={t}
                />
              </div>
            )}
            <div className='d-none d-lg-flex justify-content-center align-items-center'>
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
                <div className="d-block d-lg-none col-12 col-lg-8 mb-4">
                  <div className="mb-2">
                    <h4 className="mb-3 fw-bold">
                      <i className="bi bi-capsule"></i> {t('pillbox.title')}
                    </h4>
                    <button
                      className="btn btn-outline-success w-100"
                      onClick={() =>
                        navigate(`/${lng}/${basePath}/${calendarId}/pillbox?date=${toISO(selectedDate)}`)
                      }
                      aria-label={t('pillbox.fill')}
                      title={t('pillbox.fill')}
                    >
                      <i className="bi bi-capsule"></i> {t('pillbox.fill')}
                    </button>
                  </div>
                </div>
              )}

              {/* Pilulier - Vue desktop */}
              <div className="d-none d-lg-block col-12 col-lg-8 mb-4">
                <h4 className="mb-3 fw-bold">
                  <i className="bi bi-capsule"></i> {t('pillbox.title')}
                </h4>
                <div className='border rounded pb-3 shadow'>
                  <PillboxDisplay
                    type="calendar"
                    selectedDate={selectedDate}
                    calendarType={calendarType}
                    calendarId={calendarId}
                    basePath={basePath}
                    personalCalendars={personalCalendars}
                    sharedUserCalendars={sharedUserCalendars}
                    tokenCalendars={tokenCalendars}
                  />
                </div>
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
        <div className="container mt-4">
          {/* Calendrier mensuel */}
          <div className="container d-none d-lg-block">
            <h4 className="mb-3 fw-bold">
              <i className="bi bi-calendar-week"></i> {t('calendar.weekly_view')}
            </h4>
            <div className="alert alert-info mt-4 mb-4 shadow" role="alert">
              <i className="bi bi-pin-angle-fill"></i>
              <span>{' '}{t('calendar.weekly_help')}</span>
            </div>
            <div className="card shadow">
              <div className="card-body">
                <FullCalendar
                  /* Force le recalcul de l'instance quand la date sélectionnée change */
                  key={selectedDate ? toISO(selectedDate) : 'calendar'}
                  ref={calendarRef}
                  plugins={[dayGridPlugin, interactionPlugin, bootstrap5Plugin]}
                  initialView="dayGridWeek"
                  /* Date initiale correcte au montage */
                  initialDate={selectedDate || new Date()}
                  themeSystem="bootstrap5"
                  events={memoizedEvents}
                  headerToolbar={{
                    left: '',
                    center: '',
                    right: '',
                  }}
                  locale={t('locale')}
                  firstDay={1}
                  dateClick={handleDateClick}
                  height={400}
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
              </div>
            </div>

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
            <div className="d-block d-lg-none">
              <h4 className="mb-3 fw-bold">
                <i className="bi bi-calendar-week"></i> {t('calendar.daily_view')}
              </h4>

              <div className="card shadow">
                <div className="card-body">
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
            </div>
          )}
        </div>
      ) : (
        <div className="alert alert-info mt-4 mb-0" role="alert">
          <i className="bi bi-pin-angle-fill"></i>
          <span> {t('no_medicines')}</span>
        </div>
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
      <div className="mb-2">
        <h4 className="mb-3 fw-bold">
          <i className="bi bi-calendar-date"></i> {t('calendar.reference_week')}
        </h4>
        <div className='shadow'>
          <WeekCalendarSelector
            onWeekSelect={onWeekSelect}
            selectedDate={selectedDate}
          />
        </div>
      </div>
    )
  )
}

export default CalendarPage;
