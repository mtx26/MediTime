import React, { useState } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getCalendarSourceMap } from '../../utils/calendarSourceMap';

const Stock = ({ personalCalendars, sharedUserCalendars, tokenCalendars }) => {
  const { t } = useTranslation();
  const [selectedMethod, setSelectedMethod] = useState('weekly_pillbox');
  const params = useParams();
  const location = useLocation();

  let calendarType = 'personal';
  let calendarId = params.calendarId;
  let basePath = 'calendar';

  if (location.pathname.startsWith('/shared-user-calendar')) {
    calendarType = 'sharedUser';
    calendarId = params.calendarId;
    basePath = 'shared-user-calendar';
  }

  const calendarSource = getCalendarSourceMap(
    personalCalendars,
    sharedUserCalendars,
    tokenCalendars
  )[calendarType];
  

  const modifyStockDecrementMethod = async (method) => {
    await calendarSource.updateStockDecrementMethod(calendarId, method);
    setSelectedMethod(method);
  };

    

  return (
    <div>
      <h5 className="mb-4">{t('calendar_settings.stock.label')}</h5>

      <div className="form-check mb-3" style={{ cursor: 'pointer' }}>
        <input
          className="form-check-input"
          type="radio"
          name="stockDecrementMethod"
          id="weeklyPillbox"
          value="weekly_pillbox"
          checked={selectedMethod === 'weekly_pillbox'}
          onChange={() => modifyStockDecrementMethod('weekly_pillbox')}
          style={{ cursor: 'pointer' }}
        />
        <label className="form-check-label" htmlFor="weeklyPillbox" style={{ cursor: 'pointer' }}>
          <strong>{t('calendar_settings.stock.weekly.label')}</strong>
          <br />
          <small className="text-muted">{t('calendar_settings.stock.weekly.description')}</small>
        </label>
      </div>

      <div className="form-check" style={{ cursor: 'pointer' }}>
        <input
          className="form-check-input"
          type="radio"
          name="stockDecrementMethod"
          id="dailyMidnight"
          value="daily_midnight"
          checked={selectedMethod === 'daily_midnight'}
          onChange={() => modifyStockDecrementMethod('daily_midnight')}
          style={{ cursor: 'pointer' }}
        />
        <label className="form-check-label" htmlFor="dailyMidnight" style={{ cursor: 'pointer' }}>
          <strong>{t('calendar_settings.stock.daily.label')}</strong>
          <br />
          <small className="text-muted">{t('calendar_settings.stock.daily.description')}</small>
        </label>
      </div>
    </div>
  );
};

export default Stock;
