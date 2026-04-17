import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { toISO, buildPersonalCalendarActions, buildSharedCalendarActions } from '@meditime/utils';
import { toActionSheetItems } from '@/utils/actionSheetAdapter';
import { useCalendarData } from '@/hooks/calendar/useCalendarData';
import DateModal from '@/components/calendar/DateModal';
import WeeklyEventContent from '@/components/calendar/WeeklyEventContent';
import CalendarWeekSelector from '@/components/calendar/CalendarWeekSelector';
import PillboxDisplay from '@/components/calendar/PillboxDisplay';
import ActionSheet from '@/components/common/ActionSheet';
import NotFound from '@/pages/general/NotFound';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Pill, AlertTriangle, CalendarDays, Pin } from 'lucide-react';
import AlertBanner from '@/components/common/AlertBanner';
import '@/styles/fullcalendar-custom.css';
import { getLocale } from '@meditime/config';
import type {
  DailyCalendarPageProps as CalendarViewProps,
} from '@meditime/types';


function CalendarPage({
  personalCalendars,
  sharedUserCalendars,
  tokenCalendars,
}: CalendarViewProps) {
  const { t } = useTranslation();

  const {
    lng, calendarType, basePath, calendarId, calendarSource,
    calendarRef, dateModalRef,
    selectedDate, eventsForDay, calendarTable, isLowStock, stockDecrementMethod,
    notFound, setNotFound, memoizedEvents,
    onSelectDate, onWeekSelect, handleDateClick, navigateDay, navigateWeek,
    handleDeleteCalendar, handleDeleteSharedCalendar,
  } = useCalendarData({ personalCalendars, sharedUserCalendars, tokenCalendars });

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
                    actions={toActionSheetItems(
                      buildPersonalCalendarActions(
                        { calendarId: calendarId!, lng: lng!, basePath, selectedDate },
                        {
                          onDelete: handleDeleteCalendar,
                          onExportPdf: () => calendarSource.downloadCalendarPdf(calendarId),
                        },
                        ['rename', 'medicines'],
                      ),
                      t,
                    )}
                  />
                )}
                {calendarType === 'sharedUser' && (
                  <ActionSheet
                    actions={toActionSheetItems(
                      buildSharedCalendarActions(
                        { calendarId: calendarId!, lng: lng!, basePath, selectedDate },
                        {
                          onDelete: handleDeleteSharedCalendar,
                          onExportPdf: () => calendarSource.downloadCalendarPdf(calendarId),
                        },
                        ['medicines'],
                      ),
                      t,
                    )}
                  />
                )}
              </div>
              {/* Affichage alert stock */}
              {isLowStock && (
                <AlertBanner
                  to={`/${lng}/${basePath}/${calendarId}/stock-alerts`}
                  icon={AlertTriangle}
                  text={t('stock_alert')}
                  tooltip={t('stock_alert_tooltip')}
                  variant="warning"
                />
              )}

            </div>
            {/* Bouton pour naviguer vers la semaine suivante ou precedente */}
            {stockDecrementMethod === "weekly_pillbox" && (
              <div className='flex lg:hidden justify-center items-center' data-tour="calendar-week-selector">
                <CalendarWeekSelector
                  calendarTable={calendarTable}
                  onWeekSelect={onWeekSelect}
                  selectedDate={selectedDate}
                />
              </div>
            )}
            <div className='hidden lg:flex justify-center items-center' data-tour="calendar-week-selector">
              <CalendarWeekSelector
                calendarTable={calendarTable}
                onWeekSelect={onWeekSelect}
                selectedDate={selectedDate}
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
                      <Link to={`/${lng}/${basePath}/${calendarId}/pillbox?date=${toISO(selectedDate || new Date())}`}>
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
                  locale={getLocale(lng || 'en')}
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

export default CalendarPage;
