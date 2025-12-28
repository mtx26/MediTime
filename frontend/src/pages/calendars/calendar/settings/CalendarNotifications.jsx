import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useLoading } from '@/components/ui/loading';
import { getCalendarSourceMap } from '@/utils/calendar/calendarSourceMap';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
// notification icon
import { Bell } from 'lucide-react';


const Notifications = ({ personalCalendars, sharedUserCalendars, tokenCalendars, setNotFound }) => {
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
        // Si l'API retourne un 404, le calendrier n'existe pas
        if (rep.status === 404) {
          setNotFound(true);
        }
        setLoading(false);
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

  const { showLoading } = useLoading();

  useEffect(() => {
    showLoading(loading === undefined && calendarId, t('calendar_settings.loading_notification_settings'));
  }, [loading, calendarId, showLoading, t]);

  return (
    <div>
      <h5 className="text-lg font-semibold mb-4">
        <Bell className="inline-block mr-2 mb-1" />
        {t('calendar_settings.notifications.label')}
      </h5>
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
