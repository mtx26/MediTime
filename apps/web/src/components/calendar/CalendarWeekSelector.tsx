import { useTranslation } from 'react-i18next';
import { CalendarDays } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import WeekCalendarSelector from '@/components/calendar/WeekCalendarSelector';
import type { CalendarWeekSelectorProps } from '@meditime/types';

export default function CalendarWeekSelector({
  calendarTable,
  onWeekSelect,
  selectedDate,
}: CalendarWeekSelectorProps) {
  const { t } = useTranslation();

  const hasEvents = Object.keys(calendarTable).some(
    (key) => calendarTable[key].length > 0
  );

  if (!hasEvents) return null;

  return (
    <div className="mb-2 w-full max-w-100">
      <h4 className="mb-3 font-bold flex items-center gap-2">
        <CalendarDays className="h-5 w-5" /> {t('calendar.reference_week')}
      </h4>
      <Card className="shadow rounded-lg w-full items-center p-0">
        <CardContent className="p-0">
          <div className="h-full w-full">
            <WeekCalendarSelector onWeekSelect={onWeekSelect} selectedDate={selectedDate} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
