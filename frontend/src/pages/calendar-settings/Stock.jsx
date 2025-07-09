import React, { useEffect, useState } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const Stock = ({ personalCalendars }) => {
  const { t } = useTranslation();
  const [selectedMethod, setSelectedMethod] = useState('');
  const params = useParams();
  const location = useLocation();
  const [loading, setLoading] = useState(undefined);

  let calendarType = 'personal';
  let calendarId = params.calendarId;
  let basePath = 'calendar';

  if (location.pathname.startsWith('/shared-user-calendar')) {
    calendarType = 'sharedUser';
    calendarId = params.calendarId;
    basePath = 'shared-user-calendar';
  }

  const modifyStockDecrementMethod = async (method) => {
    await personalCalendars.updatePersonalStockDecrementMethod(calendarId, method);
    setSelectedMethod(method);
  };

  useEffect(() => {
    const initialize = async () => {
      setLoading(undefined);
      const rep = await personalCalendars.fetchPersonalStockDecrementMethod(calendarId);
      if (rep.success) {
        setSelectedMethod(rep.method);
        setLoading(false);
      } else {
        setLoading(true);
      }
    }
    initialize();

  } , [calendarId, personalCalendars.fetchPersonalStockDecrementMethod, selectedMethod]);

  if (loading === undefined && calendarId) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
      >
        <div className="spinner-border text-primary">
          <span className="visually-hidden">{t('loading_calendar')}</span>
        </div>
      </div>
    );
  }

  if (loading === true && calendarId) {
    return (
      <div className="alert alert-danger text-center mt-5" role="alert">
        ❌ {t('invalid_or_expired_link')}
      </div>
    );
  }
    

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
