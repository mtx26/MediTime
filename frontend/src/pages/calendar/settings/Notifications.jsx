import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getCalendarSourceMap } from '../../../utils/calendar/calendarSourceMap';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';


const Notifications = ({ personalCalendars, sharedUserCalendars, tokenCalendars }) => {
  const { t } = useTranslation();
  const [enabled, setEnabled] = useState(true);
  const [loading, setLoading] = useState(undefined);
  const params = useParams();
  const location = useLocation();

  let calendarType = 'personal';
  let calendarId = params.calendarId;

  const pathWithoutLang =
    location.pathname.replace(/^\/[a-z]{2}(?=\/|$)/, '') || '/';

  if (pathWithoutLang.startsWith('/shared-user-calendar')) {
    calendarType = 'sharedUser';
  } else if (pathWithoutLang.startsWith('/shared-token-calendar')) {
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
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
        <span className="sr-only">{t('loading_settings')}</span>
      </div>
    );
  }

  if (loading) return null;

  return (
    <div>
      <h5 className="text-lg font-semibold mb-4">{t('calendar_settings.notifications.label')}</h5>
      <div className="flex items-center gap-3" data-tour="settings-notifications-toggle">
        <Switch id="notifToggle" checked={enabled} onCheckedChange={toggleNotifications} />
        <Label htmlFor="notifToggle" className="cursor-pointer">
          {enabled ? t('calendar_settings.notifications.enabled') : t('calendar_settings.notifications.disabled')}
        </Label>
      </div>
    </div>
  );
};

export default Notifications;
