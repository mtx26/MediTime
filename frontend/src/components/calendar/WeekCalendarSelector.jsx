import React from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import {
  getMondayDate,
  formatToLocalISODate,
} from '../../utils/calendar/dateUtils';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';

export default function WeekCalendarSelector({ selectedDate, onWeekSelect, monday: mondayProp }) {
  // Accept Date or ISO; normalize to Date for calendar operations
  const selDate = selectedDate instanceof Date ? selectedDate : new Date(selectedDate);
  const mondayDate = mondayProp instanceof Date ? mondayProp : new Date(mondayProp || getMondayDate(selDate));
  const weekDates = [...Array(7)].map((_, i) => {
    const d = new Date(mondayDate);
    d.setDate(d.getDate() + i);
    d.setHours(0,0,0,0);
    return d;
  });
  const todayIso = formatToLocalISODate(new Date());
  const { t } = useTranslation();

  const handleChange = (date) => {
    const mondayDate = getMondayDate(date);
    onWeekSelect(mondayDate);
  };

  return (
    <Calendar
  onClickDay={handleChange}
  value={selDate}
      locale={t('locale')}
      tileClassName={({ date, view }) => {
        if (view === 'month') {
          const date_iso = formatToLocalISODate(date);

          if (todayIso === date_iso) {
            return 'bg-success text-white';
          }
          if (weekDates.map(d => formatToLocalISODate(d)).includes(date_iso)) {
            return 'bg-primary text-white';
          }
        }
        return null;
      }}
    />
  );
}

WeekCalendarSelector.propTypes = {
  selectedDate: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]).isRequired,
  onWeekSelect: PropTypes.func.isRequired,
  monday: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
};
