import React from 'react';
import { Calendar } from '@/components/ui/calendar';
import { getMondayDate } from '../../utils/calendar/dateUtils';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { getDateLocale } from '../../config/languages';

export default function WeekCalendarSelector({ onWeekSelect, selectedDate }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  // Accept Date or ISO; normalize to Date for calendar operations
  const selDate = selectedDate
    ? (selectedDate instanceof Date ? selectedDate : new Date(selectedDate))
    : today;
  const mondayDate = getMondayDate(selDate);
  const weekDates = [...Array(7)].map((_, i) => {
    const d = new Date(mondayDate);
    d.setDate(d.getDate() + i);
    d.setHours(0, 0, 0, 0);
    return d;
  });

  const { i18n } = useTranslation();

  const handleSelect = (date) => {
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
      fixedWeeks
      modifiers={{ weekSelected: weekDates }}
      modifiersClassNames={{
        weekSelected:
          'bg-primary text-primary-foreground hover:bg-primary/90 data-[selected=true]:bg-primary rounded-md'
      }}
    />
  );
}

WeekCalendarSelector.propTypes = {
  selectedDate: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.instanceOf(Date),
    PropTypes.number,
    PropTypes.oneOf([undefined, null])
  ]),
  onWeekSelect: PropTypes.func.isRequired,
  monday: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
};
