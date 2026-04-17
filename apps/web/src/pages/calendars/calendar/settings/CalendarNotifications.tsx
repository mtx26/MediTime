import { useTranslation } from 'react-i18next';
import { useCalendarNotifications } from '@/hooks/calendars/useCalendarNotifications';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bell } from 'lucide-react';
import type { CalendarNotificationsProps } from '@meditime/types';

function Notifications(props: CalendarNotificationsProps) {
  const { t } = useTranslation();
  const { enabled, toggleNotifications } = useCalendarNotifications(props);

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
}

export default Notifications;
