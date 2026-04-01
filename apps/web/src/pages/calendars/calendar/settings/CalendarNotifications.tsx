import { useState, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useLoading } from '@/components/ui/loading';
import { getCalendarSourceMap } from '@meditime/utils';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bell } from 'lucide-react';
import { CALENDAR_ROUTE_PREFIXES } from '@meditime/constants';
import type {
  CalendarNotificationsProps,
  CalendarNotificationsSource,
} from '@meditime/types';


const Notifications = ({ personalCalendars, sharedUserCalendars, tokenCalendars, setNotFound }: CalendarNotificationsProps) => {
  const { t } = useTranslation();
  const [enabled, setEnabled] = useState(true);
  const [loading, setLoading] = useState<boolean | undefined>(undefined);
  const params = useParams<{ calendarId?: string; sharedToken?: string }>();
  const location = useLocation();

  let calendarType: 'personal' | 'sharedUser' | 'token' = 'personal';
  let calendarId = params.calendarId;

  const pathWithoutLang =
    location.pathname.replace(/^\/[a-z]{2}(?=\/|$)/, '') || '/';

  if (pathWithoutLang.startsWith(CALENDAR_ROUTE_PREFIXES.SHARED_USER)) {
    calendarType = 'sharedUser';
  } else if (pathWithoutLang.startsWith(CALENDAR_ROUTE_PREFIXES.SHARED_TOKEN)) {
    calendarType = 'token';
    calendarId = params.sharedToken;
  }

  const calendarSource = getCalendarSourceMap(
    personalCalendars,
    sharedUserCalendars,
    tokenCalendars
  )[calendarType] as unknown as CalendarNotificationsSource;

  useEffect(() => {
    const fetchNotificationSetting = async () => {
      const rep = await calendarSource.fetchNotificationsEnabled(calendarId);
      if (rep.success) {
        setEnabled(rep["notifications-enabled"] ?? false);
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
  }, [calendarId, calendarSource, enabled, setNotFound]);

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
    showLoading(Boolean(loading === undefined && calendarId), t('calendar_settings.loading_notification_settings'));
  }, [loading, calendarId, showLoading, t]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-primary" />
          <CardTitle>{t('calendar_settings.notifications.label')}</CardTitle>
        </div>
        <CardDescription>{t('calendar_settings.notifications.description')}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="p-4 border rounded-lg bg-accent/20">
          <div className="flex items-center gap-3" data-tour="settings-notifications-toggle">
            <Switch id="notifToggle" checked={enabled} onCheckedChange={toggleNotifications} />
            <div className="flex-1">
              <Label htmlFor="notifToggle" className="cursor-pointer font-medium">
                {enabled ? t('calendar_settings.notifications.enabled') : t('calendar_settings.notifications.disabled')}
              </Label>
              <p className="text-xs text-muted-foreground mt-1">
                {enabled ? t('calendar_settings.notifications.enabled_hint') : t('calendar_settings.notifications.disabled_hint')}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default Notifications;
