import React from 'react';
import { Calendar } from '@/components/ui/calendar';
import { getMondayDate } from '../../utils/calendar/dateUtils';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { getDateLocale } from '../../config/languages';

export default function WeekCalendarSelector({ onWeekSelect, selectedDate }) {
  // Accept Date or ISO; normalize to Date for calendar operations
  const selDate = selectedDate instanceof Date ? selectedDate : new Date(selectedDate);
  const mondayDate = getMondayDate(selDate);
  const weekDates = [...Array(7)].map((_, i) => {
    const d = new Date(mondayDate);
    d.setDate(d.getDate() + i); 
    d.setHours(0,0,0,0);
    return d;
  });
  const today = new Date();
  today.setHours(0,0,0,0);
  const { i18n } = useTranslation();

  const handleSelect = (date) => {
    if (date) {
      onWeekSelect(date);
    }
  };

  return (
    <Calendar
      mode="single"
      selected={selDate}
      onSelect={handleSelect}
      locale={getDateLocale(i18n.language)}
      modifiers={{
        weekSelected: weekDates
      }}
      modifiersClassNames={{
        weekSelected: 'bg-primary text-primary-foreground hover:bg-primary/90 data-[selected=true]:bg-primary rounded-md'
      }}
      className="border rounded-lg w-full"
    />
  );
}

WeekCalendarSelector.propTypes = {
  selectedDate: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]).isRequired,
  onWeekSelect: PropTypes.func.isRequired,
  monday: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
};
