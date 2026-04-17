import { useState, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useLoading } from '@/components/ui/loading';
import { getCalendarSourceMap, detectCalendarType } from '@meditime/utils';
import type {
  CalendarNotificationsProps,
  CalendarNotificationsSource,
} from '@meditime/types';

export function useCalendarNotifications({
  personalCalendars,
  sharedUserCalendars,
  tokenCalendars,
  setNotFound,
}: CalendarNotificationsProps) {
  const { t } = useTranslation();
  const params = useParams<{ calendarId?: string; sharedToken?: string }>();
  const location = useLocation();

  const { calendarType } = detectCalendarType(location.pathname);
  const calendarId = calendarType === 'token' ? params.sharedToken : params.calendarId;

  const calendarSource = getCalendarSourceMap(
    personalCalendars,
    sharedUserCalendars,
    tokenCalendars,
  )[calendarType] as unknown as CalendarNotificationsSource;

  const [enabled, setEnabled] = useState(true);
  const [loading, setLoading] = useState<boolean | undefined>(undefined);

  useEffect(() => {
    const fetchNotificationSetting = async () => {
      const rep = await calendarSource.fetchNotificationsEnabled(calendarId);
      if (rep.success) {
        setEnabled(rep['notifications-enabled'] ?? false);
        setLoading(false);
      } else {
        if (rep.status === 404) {
          setNotFound(true);
        }
        setLoading(false);
      }
    };

    fetchNotificationSetting();
  }, [calendarId, calendarSource, enabled, setNotFound]);

  const toggleNotifications = async () => {
    const newValue = !enabled;
    const rep = await calendarSource.updateNotificationsEnabled(calendarId, newValue);
    if (rep.success) {
      setEnabled(newValue);
    }
  };

  const { showLoading } = useLoading();

  useEffect(() => {
    showLoading(Boolean(loading === undefined && calendarId), t('calendar_settings.loading_notification_settings'));
  }, [loading, calendarId, showLoading, t]);

  return { enabled, toggleNotifications };
}
