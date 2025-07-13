import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getCalendarSourceMap } from '../../../utils/calendarSourceMap';

const Notifications = ({ personalCalendars, sharedUserCalendars, tokenCalendars }) => {
  const { t } = useTranslation();
  const [enabled, setEnabled] = useState(true);
  const [loading, setLoading] = useState(undefined);
  const params = useParams();
  const location = useLocation();

  let calendarType = 'personal';
  let calendarId = params.calendarId;

  if (location.pathname.startsWith('/shared-user-calendar')) {
    calendarType = 'sharedUser';
  } else if (location.pathname.startsWith('/shared-token-calendar')) {
    calendarType = 'token';
    calendarId = params.sharedToken;
  }

  const calendarSource = getCalendarSourceMap(
    personalCalendars,
    sharedUserCalendars,
    tokenCalendars
  )[calendarType];

  useEffect(() => {
    const fetchNotificationSetting = async () => {
      setLoading(undefined);
      const rep = await calendarSource.fetchNotificationsEnabled(calendarId);
      if (rep.success) {
        setEnabled(rep["notifications-enabled"]);
        setLoading(false);
      } else {
        setLoading(true);
      }
    };

    fetchNotificationSetting();
  }, [calendarId, calendarSource.fetchNotificationsEnabled, enabled]);

  const toggleNotifications = async () => {
    // TODO: alert 
    const newValue = !enabled;
    const rep = await calendarSource.updateNotificationsEnabled(calendarId, newValue);
    if (rep.success) {
      setEnabled(newValue);
    }
  };

  if (loading === undefined && calendarId) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
      >
        <div className="spinner-border text-primary">
          <span className="visually-hidden">{t('loading_settings')}</span>
        </div>
      </div>
    );
  }

  if (loading) return null;

  return (
    <div>
      <h5 className="mb-4">{t('calendar_settings.notifications.label')}</h5>
      <div className="form-check form-switch">
        <input
          className="form-check-input"
          type="checkbox"
          role="switch"
          id="notifToggle"
          checked={enabled}
          onChange={toggleNotifications}
        />
        <label className="form-check-label" htmlFor="notifToggle">
          {enabled
            ? t('calendar_settings.notifications.enabled')
            : t('calendar_settings.notifications.disabled')}
        </label>
      </div>
    </div>
  );
};

export default Notifications;
