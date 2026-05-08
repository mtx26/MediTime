
import { useTranslation } from 'react-i18next';
import { AlertTriangle } from 'lucide-react';
import AlertBanner from '@/components/common/AlertBanner';
import WeeklyEventContent from '@/components/calendar/WeeklyEventContent';
import NotFound from '@/pages/general/NotFound';
import { useDailyCalendar } from '@/hooks/calendar/useDailyCalendar';
import type { DailyCalendarPageProps } from '@meditime/types';

export default function DailyCalendarPage(props: DailyCalendarPageProps) {
  const { t } = useTranslation();
  const {
    lng, basePath, calendarId,
    selectedDate, eventsForDay, isLowStock,
    loading, notFound,
    onSelectDate, navigateDay, navigateWeek,
  } = useDailyCalendar(props);

  if (loading && calendarId) return null;
  if (notFound) return <NotFound />;

  return (
    <div className="daily-calendar-page">
      {isLowStock && (
        <AlertBanner
          to={`/${lng || 'fr'}/${basePath}/${calendarId}/stock-alerts`}
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
