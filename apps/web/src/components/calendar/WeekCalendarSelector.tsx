import { Calendar } from '@/components/ui/calendar';
import { getWeekDates, normalizeToStartOfDay } from '@meditime/utils';
import { useTranslation } from 'react-i18next';
import { getDateLocale } from '@meditime/config';
import type { WeekCalendarSelectorProps } from '@meditime/types';

export default function WeekCalendarSelector({ onWeekSelect, selectedDate }: WeekCalendarSelectorProps) {
  const today = normalizeToStartOfDay(new Date());
  // Accept Date or ISO; normalize to Date for calendar operations
  const selDate = selectedDate
    ? normalizeToStartOfDay(selectedDate instanceof Date ? selectedDate : new Date(selectedDate))
    : today;
    
  const weekDates = getWeekDates(selDate);
  const defaultMonth = weekDates[6] ?? selDate;

  const { i18n } = useTranslation();

  const handleSelect = (date: Date | undefined) => {
    if (date) {
      onWeekSelect(date);
    }
  };
  return (
    <Calendar
      mode="single"
      selected={selDate || today}
      onSelect={handleSelect}
      locale={getDateLocale(i18n.language)}
      showOutsideDays
      modifiers={{ weekSelected: weekDates }}
      modifiersClassNames={{
        weekSelected:
          "bg-primary text-primary-foreground hover:bg-primary/90 data-[selected=true]:bg-primary rounded-md",
      }}
      defaultMonth={defaultMonth}
    />

  );
}
