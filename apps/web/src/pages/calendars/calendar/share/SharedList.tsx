import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import CalendarCard from '@/components/share/CalendarCard';
import { useSharedList } from '@/hooks/share/useSharedList';
import { DEMO_CALENDAR_ID } from '@meditime/constants';
import type { SharedListPageProps } from '@meditime/types';

function SharedList(props: SharedListPageProps) {
  const { t } = useTranslation();
  const {
    loadingGroupedShared,
    groupedShared,
    selectedCalendarId,
    setSelectedCalendarId,
    calendarFromURL,
    refreshGroupedShared,
  } = useSharedList(props);

  if (loadingGroupedShared) return null;

  if (
    props.personalCalendars.calendarsData &&
    props.personalCalendars.calendarsData.length === 0 &&
    calendarFromURL !== DEMO_CALENDAR_ID
  ) {
    return (
      <div className="container mx-auto mt-4 text-center">
        <h3 className="text-muted-foreground">{t('no_calendar_found')}</h3>
        <p className="text-muted-foreground">{t('no_calendar_found_cta')}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-3xl">
      <div className="mb-2 pb-2">
        <div className="flex flex-nowrap gap-2 p-1 overflow-auto scroll-smooth">
          {calendarFromURL === DEMO_CALENDAR_ID && (
            <Button asChild variant="default" className="rounded-full px-3 py-1 font-semibold shadow-sm whitespace-nowrap">
              <Link to={`?calendar=${DEMO_CALENDAR_ID}`} title={t('tour.calendar_name')}>
                {t('tour.calendar_name')}
              </Link>
            </Button>
          )}
          {(props.personalCalendars.calendarsData ?? []).map((calendar) => (
            <Button
              key={calendar.id}
              asChild
              variant={selectedCalendarId === calendar.id ? 'default' : 'outline'}
              className="rounded-full px-3 py-1 font-semibold shadow-sm whitespace-nowrap"
            >
              <Link
                to={`?calendar=${calendar.id}`}
                onClick={() => setSelectedCalendarId(calendar.id)}
                title={calendar.name}
              >
                {calendar.name.length > 20 ? calendar.name.slice(0, 17) + '...' : calendar.name}
              </Link>
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {Object.entries(groupedShared)
          .filter(([calendarId]) => calendarId === selectedCalendarId)
          .map(([calendarId, data]) => (
            <CalendarCard
              key={calendarId}
              calendarId={calendarId}
              data={data}
              personalCalendars={props.personalCalendars}
              tokenCalendars={props.tokenCalendars}
              sharedUserCalendars={props.sharedUserCalendars}
              onRefresh={refreshGroupedShared}
            />
          ))}
      </div>
    </div>
  );
}

export default SharedList;