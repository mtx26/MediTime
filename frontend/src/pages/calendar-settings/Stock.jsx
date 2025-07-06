import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const Stock = () => {
  const { t } = useTranslation();
  const [selectedMethod, setSelectedMethod] = useState('weekly_pillbox');

  useEffect(() => {
    console.log('Méthode de décompte sélectionnée :', selectedMethod);
    // Tu peux appeler ton API ici
  }, [selectedMethod]);

  return (
    <div>
      <h5 className="mb-4">{t('calendar_settings.stock.label')}</h5>

      <div className="form-check mb-3">
        <input
          className="form-check-input"
          type="radio"
          name="stockDecrementMethod"
          id="weeklyPillbox"
          value="weekly_pillbox"
          checked={selectedMethod === 'weekly_pillbox'}
          onChange={() => setSelectedMethod('weekly_pillbox')}
        />
        <label className="form-check-label" htmlFor="weeklyPillbox">
          <strong>{t('calendar_settings.stock.weekly.label')}</strong>
          <br />
          <small className="text-muted">{t('calendar_settings.stock.weekly.description')}</small>
        </label>
      </div>

      <div className="form-check">
        <input
          className="form-check-input"
          type="radio"
          name="stockDecrementMethod"
          id="dailyMidnight"
          value="daily_midnight"
          checked={selectedMethod === 'daily_midnight'}
          onChange={() => setSelectedMethod('daily_midnight')}
        />
        <label className="form-check-label" htmlFor="dailyMidnight">
          <strong>{t('calendar_settings.stock.daily.label')}</strong>
          <br />
          <small className="text-muted">{t('calendar_settings.stock.daily.description')}</small>
        </label>
      </div>
    </div>
  );
};

export default Stock;
