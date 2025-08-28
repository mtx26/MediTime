import { getWeekDaysISOStrings, getMondayFromDate, formatToLocalISODate } from '../../utils/calendar/dateUtils';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';

export default function WeekDayCircles({ selectedDate, onSelectDate }) {
  const { i18n } = useTranslation();
  const today = formatToLocalISODate(new Date());
  const monday = getMondayFromDate(selectedDate);

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
      {getWeekDaysISOStrings(monday).map((day, index) => {
        const isSelected = day === selectedDate;
        const isToday = day === today;

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
            onClick={() => onSelectDate(formatToLocalISODate(day))}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                onSelectDate(formatToLocalISODate(day));
              }
            }}
            style={pillStyle}
          >
            <div className="d-flex flex-column align-items-center justify-content-center">
              <div style={{ fontSize: 9, lineHeight: 1, textTransform: 'capitalize' }}>
                {new Date(day).toLocaleDateString(i18n.language || undefined, { weekday: 'short' })}
              </div>
              <div style={{ fontWeight: 700, lineHeight: 1 }}>
                {new Date(day).getDate()}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

WeekDayCircles.propTypes = {
  selectedDate: PropTypes.string.isRequired,
  onSelectDate: PropTypes.func.isRequired,
};
