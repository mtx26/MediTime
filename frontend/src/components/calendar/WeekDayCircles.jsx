import { getMondayDate } from '../../utils/calendar/dateUtils';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function WeekDayCircles({ selectedDate, onSelectDate }) {
  const { i18n } = useTranslation();
  // normalise les dates à minuit pour comparaisons simples
  const today = new Date();
  today.setHours(0,0,0,0);
  
  // Normaliser selectedDate pour la comparaison
  const normalizedSelectedDate = new Date(selectedDate);
  normalizedSelectedDate.setHours(0,0,0,0);
  
  const mondayDate = getMondayDate(selectedDate);
  const weekDates = [...Array(7)].map((_, i) => {
    const d = new Date(mondayDate);
    d.setDate(d.getDate() + i);
    d.setHours(0,0,0,0);
    return d;
  });

  return (
    <div className="flex w-full overflow-hidden gap-1 py-1 justify-between items-center">
      {weekDates.map((day, index) => {
        const isSelected = day.getTime() === normalizedSelectedDate.getTime();
        const isToday = day.getTime() === today.getTime();

        const ariaLabel = `Aller au ${new Date(day).toLocaleDateString(i18n.language || undefined, {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
        })}`;

        return (
          <Button
            key={index}
            type="button"
            variant={isToday || isSelected ? "default" : "outline"}
            size="sm"
            className={cn(
              "rounded-full inline-flex items-center justify-center shadow-sm shrink-0 h-7.5 min-w-7 max-w-30 px-1.5 py-0.5 text-[0.68rem]",
              isToday && "bg-green-500 text-white hover:bg-green-600 shadow-lg border-green-600",
              isSelected && !isToday && "bg-primary text-primary-foreground hover:bg-primary/90",
            )}
            aria-label={ariaLabel}
            onClick={() => onSelectDate(day)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                onSelectDate(day);
              }
            }}
            style={{ flex: '0 0 calc((100% - 24px) / 7)' }}
          >
            <div className="flex flex-col items-center justify-center">
              <div className="text-[9px] leading-none capitalize">
                {day.toLocaleDateString(i18n.language || undefined, { weekday: 'short' })}
              </div>
              <div className="font-bold leading-none">
                {day.getDate()}
              </div>
            </div>
          </Button>
        );
      })}
    </div>
  );
}

WeekDayCircles.propTypes = {
  selectedDate: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]).isRequired,
  onSelectDate: PropTypes.func.isRequired,
};
