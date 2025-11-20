import { getMondayDate } from '../../utils/calendar/dateUtils';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';

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
    <div
      className="d-flex"
      style={{
        width: '100%',
        overflow: 'hidden',
        gap: 4,
        padding: '4px 0',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}
    >
      {weekDates.map((day, index) => {
        const isSelected = day.getTime() === normalizedSelectedDate.getTime();
        const isToday = day.getTime() === today.getTime();

        const baseClassStart = 'btn btn-sm rounded-pill d-inline-flex align-items-center justify-content-center shadow-sm';
        const colorClass = isToday ? 'btn-success text-white' : isSelected ? 'btn-primary text-white' : 'btn-light text-dark';
        const baseClass = `${baseClassStart} ${colorClass} ${isToday ? 'shadow-lg' : ''}`;

        const ariaLabel = `Aller au ${new Date(day).toLocaleDateString(i18n.language || undefined, {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
        })}`;

        // Use Bootstrap shadow utilities for consistent appearance
        const pillStyle = {
          flex: '0 0 calc((100% - 24px) / 7)',
          maxWidth: 120,
          minWidth: 28,
          height: 30,
          padding: '2px 6px',
          flexShrink: 0,
          fontSize: '0.68rem',
        };

        return (
          <button
            key={index}
            type="button"
            className={baseClass}
            role="button"
            tabIndex={0}
            aria-label={ariaLabel}
            onClick={() => onSelectDate(day)}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                onSelectDate(day);
              }
            }}
            style={pillStyle}
          >
            <div className="d-flex flex-column align-items-center justify-content-center">
              <div style={{ fontSize: 9, lineHeight: 1, textTransform: 'capitalize' }}>
                {day.toLocaleDateString(i18n.language || undefined, { weekday: 'short' })}
              </div>
              <div style={{ fontWeight: 700, lineHeight: 1 }}>
                {day.getDate()}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

WeekDayCircles.propTypes = {
  selectedDate: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]).isRequired,
  onSelectDate: PropTypes.func.isRequired,
};
