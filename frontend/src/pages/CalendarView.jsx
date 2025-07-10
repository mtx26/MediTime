// CalendarPage.jsx
import React, { useEffect, useContext, useRef, useState, useMemo } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { useTranslation } from 'react-i18next';
import { UserContext } from '../contexts/UserContext';
import { formatToLocalISODate, getMondayFromDate } from '../utils/dateUtils';
import { getCalendarSourceMap } from '../utils/calendarSourceMap';
import ShareCalendarModal from '../components/ShareCalendarModal';
import AlertSystem from '../components/AlertSystem';
import isEqual from 'lodash/isEqual';
import bootstrap5Plugin from '@fullcalendar/bootstrap5';
import 'bootstrap/dist/css/bootstrap.css';
import DateModal from '../components/DateModal';
import WeekCalendarSelector from '../components/WeekCalendarSelector';
import WeeklyEventContent from '../components/WeeklyEventContent';
import PillboxDisplay from '../components/PillboxDisplay';
import ActionSheet from '../components/ActionSheet';

function CalendarPage({
  personalCalendars,
  sharedUserCalendars,
  tokenCalendars,
}) {
  // 📍 Paramètres d'URL et navigation
  const navigate = useNavigate(); // Hook de navigation
  const location = useLocation();
  const params = useParams();
  const { t } = useTranslation();

  // 🔐 Contexte d'authentification
  const { userInfo } = useContext(UserContext); // Contexte de l'utilisateur connecté

  const calendarRef = useRef(null);
  const [selectedDate, setSelectedDate] = useState(
    formatToLocalISODate(new Date())
  ); // Date sélectionnée
  const [eventsForDay, setEventsForDay] = useState([]); // Événements filtrés pour un jour spécifique
  const [calendarEvents, setCalendarEvents] = useState([]); // Événements du calendrier
  const [calendarTable, setCalendarTable] = useState([]); // Événements du calendrier
  const [calendarName, setCalendarName] = useState(''); // Nom du calendrier
  const [isLowStock, setIsLowStock] = useState(false); // Indicateur de stock faible
  const [alertType, setAlertType] = useState(''); // Type d'alerte
  const [alertMessage, setAlertMessage] = useState(''); // Message d'alerte
  const [existingShareToken, setExistingShareToken] = useState(null); // Token existant
  const [sharedUsersData, setSharedUsersData] = useState([]); // Utilisateurs partageant le calendrier

  // 🔄 Références et chargement
  const dateModalRef = useRef(null);
  const shareModalRef = useRef(null); // Référence vers le modal (pour gestion focus/fermeture)
  const [loading, setLoading] = useState(undefined); // État de chargement du calendrier
  const [loadingShare, setLoadingShare] = useState(false); // État de chargement du partage du calendrier

  const [startDate, setStartDate] = useState(getMondayFromDate(new Date()));

  let calendarType = 'personal';
  let calendarId = params.calendarId;
  let basePath = 'calendar';

  if (location.pathname.startsWith('/shared-user-calendar')) {
    calendarType = 'sharedUser';
    calendarId = params.calendarId;
    basePath = 'shared-user-calendar';
  } else if (location.pathname.startsWith('/shared-token-calendar')) {
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
  const onSelectDate = (isoDate) => {
    setSelectedDate(isoDate);
    setEventsForDay(calendarEvents.filter((e) => e.start.startsWith(isoDate)));
  };

  // Fonction pour naviguer vers la semaine suivante ou precedente
  const onWeekSelect = async (monday) => {
    const isoDate = formatToLocalISODate(monday);
    setStartDate(isoDate);
    const rep = await calendarSource.fetchSchedule(calendarId, isoDate);
    if (rep.success) {
      setCalendarEvents(rep.schedule);
      setCalendarTable(rep.table);
      calendarRef.current?.getApi().gotoDate(isoDate);
      onSelectDate(isoDate);
    }
  };

  // Fonction pour gérer le clic sur une date
  const handleDateClick = (info) => {
    const clickedDate = info.dateStr;
    setSelectedDate(clickedDate);
    dateModalRef.current?.open();
  };

  // Fonction pour partager le calendrier
  const handleShareCalendarClick = async () => {
    setLoadingShare(true);
    setExistingShareToken(null);
    setSharedUsersData([]);
    shareModalRef.current?.open();
    const token = await tokenCalendars.tokensList.find(
      (t) =>
        t.calendar_id === calendarId &&
        !t.revoked &&
        t.owner_uid === userInfo.uid
    );
    const rep = await sharedUserCalendars.fetchSharedUsers(calendarId);
    if (rep.success) {
      setSharedUsersData(rep.users);
    }
    setExistingShareToken(token || null);
    setLoadingShare(false);
  };

  // Fonction pour naviguer vers la date suivante ou precedente
  const navigateDay = (direction) => {
    const current = new Date(selectedDate);
    current.setDate(current.getDate() + direction);
    const newDate = formatToLocalISODate(current);
    setSelectedDate(newDate);
  };

  // Fonction pour charger le calendrier lorsque l'utilisateur est connecté ou que le calendrier est un token
  useEffect(() => {
    if (!calendarId) return;
    if (calendarType === 'personal' || calendarType === 'sharedUser') {
      if (!userInfo) {
        setLoading(undefined);
        return;
      }
      if (!userInfo) {
        setLoading(undefined);
        return;
      }
    }
    const load = async () => {
      const rep = await calendarSource.fetchSchedule(calendarId);
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
        setLoading(!rep.success);
      }
    };

    load();
  }, [calendarId, calendarSource.fetchSchedule, userInfo]);

  // 📍 Filtrage des événements pour un jour spécifique et tri par ordre alphabétique
  useEffect(() => {
    if (!selectedDate || !calendarEvents.length) return;
    const sortedEvents = calendarEvents.sort((a, b) => {
      const dateA = new Date(a.start);
      const dateB = new Date(b.start);
      if (dateA.getTime() === dateB.getTime()) {
        return a.title.localeCompare(b.title);
      }
      return dateA.getTime() - dateB.getTime();
    });
    const filtered = sortedEvents.filter((event) =>
      event.start.startsWith(selectedDate)
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

  if (loading === undefined && calendarId) {
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

  if (loading === true && calendarId) {
    return (
      <div className="alert alert-danger text-center mt-5" role="alert">
        ❌ {t('invalid_or_expired_link')}
      </div>
    );
  }

  return (
    <>
      {calendarType === 'personal' && (
        // Modal pour partager un calendrier
        <ShareCalendarModal
          ref={shareModalRef}
          loading={loadingShare}
          calendarId={calendarId}
          calendarName={calendarName}
          existingShareToken={existingShareToken}
          sharedUsersData={sharedUsersData}
          tokenCalendars={tokenCalendars}
          sharedUserCalendars={sharedUserCalendars}
          setAlertType={setAlertType}
          setAlertMessage={setAlertMessage}
        />
      )}

      <div className="container mt-2">
        <div className="row justify-content-center">
          <div className="col-12 col-lg-4 mb-4">
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
                  onClick={() => navigate(`/${basePath}/${calendarId}/boxes`)}
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
                      {
                        label: (
                          <>
                            <i className="bi bi-box-arrow-up me-2" /> {t('share')}
                          </>
                        ),
                        onClick: handleShareCalendarClick,
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
                        onClick: () => navigate(`/${basePath}/${calendarId}/stock-alerts`),
                      },
                      { separator: true },
                      {
                        label: (
                          <>
                            <i className="bi bi-gear me-2" /> {t('settings.label')}
                          </>
                        ),
                        onClick: () => navigate(`/${basePath}/${calendarId}/settings`),
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
                            navigate('/calendars');
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
                        onClick: () => navigate(`/${basePath}/${calendarId}/settings`),
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
                  className="alert alert-warning d-flex align-items-center justify-content-between px-3 py-2 shadow-sm"
                  onClick={() => navigate(`/${basePath}/${calendarId}/stock-alerts`)}
                  title={t('stock_alert_tooltip')}
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
            {Object.keys(calendarTable).filter(
              (key) => calendarTable[key].length > 0
            ).length > 0 && (
              <div className="mb-2">
                <h4 className="mb-3 fw-bold">
                  <i className="bi bi-calendar-date"></i> {t('calendar.reference_week')}
                </h4>
                <WeekCalendarSelector
                  selectedDate={startDate}
                  onWeekSelect={onWeekSelect}
                />
              </div>
            )}
          </div>

          {/* Pilulier */}
          {Object.keys(calendarTable).filter((key) => calendarTable[key].length > 0)
          .length > 0 && (
            <>
              {/* Pilulier - Vue mobile */}
              <div className="d-block d-lg-none col-12 col-lg-8 mb-4">
                <div className="mb-2">
                  <h4 className="mb-3 fw-bold">
                    <i className="bi bi-capsule"></i> {t('pillbox.title')}
                  </h4>
                  <button
                    className="btn btn-outline-success w-100"
                    onClick={() => navigate(`/${basePath}/${calendarId}/pillbox?date=${startDate}`)}
                  >
                    <i className="bi bi-capsule"></i> {t('pillbox.fill')}
                  </button>
                </div>
              </div>

              {/* Pilulier - Vue desktop */}
              <div className="d-none d-lg-block col-12 col-lg-8 mb-4">
                <h4 className="mb-3 fw-bold">
                  <i className="bi bi-capsule"></i> {t('pillbox.title')}
                </h4>
                <PillboxDisplay
                  type="calendar"
                  selectedDate={startDate}
                  calendarType={calendarType}
                  calendarId={calendarId}
                  basePath={basePath}
                  personalCalendars={personalCalendars}
                  sharedUserCalendars={sharedUserCalendars}
                  tokenCalendars={tokenCalendars}
                />
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
          <div className="container d-none d-md-block">
            <h4 className="mb-3 fw-bold">
              <i className="bi bi-calendar-week"></i> {t('calendar.weekly_view')}
            </h4>
            <div className="alert alert-info mt-4 mb-4" role="alert">
              <i className="bi bi-pin-angle-fill"></i>
              <span>{' '}{t('calendar.weekly_help')}</span>
            </div>
            <div className="card shadow-sm">
              <div className="card-body">
                <FullCalendar
                  ref={calendarRef}
                  plugins={[dayGridPlugin, interactionPlugin, bootstrap5Plugin]}
                  initialView="dayGridWeek"
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
            />
          </div>

          {/* Calendrier - Vue mobile uniquement */}
          <div className="d-block d-md-none">
            <h4 className="mb-3 fw-bold">
              <i className="bi bi-calendar-week"></i> {t('calendar.daily_view')}
            </h4>

            <div className="card shadow-sm">
              <div className="card-body">
                <WeeklyEventContent
                  ifModal={false}
                  selectedDate={selectedDate}
                  eventsForDay={eventsForDay}
                  onSelectDate={onSelectDate}
                  onNext={() => navigateDay(1)}
                  onPrev={() => navigateDay(-1)}
                />
              </div>
            </div>
          </div>
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

export default CalendarPage;
