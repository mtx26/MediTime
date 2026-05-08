import { useContext, useState, useEffect } from 'react';
import { UserContext } from '@/contexts/UserContext';
import { useTranslation } from 'react-i18next';
import { updateUserInfo } from '@/services/auth/authService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Bell, RefreshCw, Smartphone, Settings } from 'lucide-react';
import type { NotificationSettingsProps } from '@meditime/types';

export default function Notification({ fcm, user }: NotificationSettingsProps) {
  const { t } = useTranslation();
  const userContext = useContext(UserContext);
  const userInfo = userContext?.userInfo ?? null;
  const uid = userInfo?.uid ?? null;
  const [notificationsEnabled, setNotificationsEnabled] = useState(window?.Notification?.permission === 'granted');
  const notificationNotSupported = !('Notification' in window) || window.Notification.permission === 'denied';
  const [isRegistering, setIsRegistering] = useState(false);
  const [notificationTime, setNotificationTime] = useState<string | null>(null);

  // fetch notification time on component mount
  useEffect(() => {
    const fetchNotificationTime = async () => {
      const rep = await user.fetchNotificationTime();
      if (rep.success) {
        setNotificationTime(rep.notification_time ?? null);
      }
    };

    fetchNotificationTime();
  }, [user.fetchNotificationTime, notificationTime]);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* En-tête */}
      <div className="space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">{t('notification.label')}</h2>
        <p className="text-muted-foreground">{t('notification.instructions')}</p>
      </div>

      {/* Section Préférences de notification */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            <CardTitle>{t('notification.preferences.title')}</CardTitle>
          </div>
          <CardDescription>{t('notification.preferences.description')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Email notifications */}
          <div className="flex items-center justify-between gap-1">
            <div className="flex items-center gap-3">
              <div>
                <Label htmlFor="emailNotificationToggle" className="cursor-pointer font-medium text-sm">
                  {t('notification.email_toggle')}
                </Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {t('notification.email_description')}
                </p>
              </div>
            </div>
            <Switch
              id="emailNotificationToggle"
              checked={userInfo?.emailEnabled}
              onCheckedChange={() => {
                updateUserInfo({
                  email_enabled: !userInfo?.emailEnabled,
                  uid
                })
              }}
            />
          </div>

          {/* Push notifications */}
          <div className="flex items-center justify-between gap-1">
            <div className="flex items-center gap-3">
              <div>
                <Label htmlFor="pushNotificationToggle" className="cursor-pointer font-medium text-sm">
                  {t('notification.push_toggle')}
                </Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {t('notification.push_description')}
                </p>
              </div>
            </div>
            <Switch
              id="pushNotificationToggle"
              checked={userInfo?.pushEnabled}
              onCheckedChange={() => {
                updateUserInfo({
                  push_enabled: !userInfo?.pushEnabled
                })
              }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Section notification time */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-primary" />
            <CardTitle>{t('settings.notification_time')}</CardTitle>
          </div>
          <CardDescription>{t('settings.notification_time_desc')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <Label htmlFor="notificationTime" className="font-medium text-sm">
                {t('settings.notification_time_label')}
              </Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                {t('settings.notification_time_note')}
              </p>
            </div>
            <Input
              id="notificationTime"
              type="time"
              value={notificationTime ? notificationTime.slice(0, 5) : ''}
              onChange={async (e) => {
                await user.updateNotificationTime(e.target.value);
                setNotificationTime(e.target.value);
              }}
              className="w-24"
            />
          </div>
        </CardContent>
      </Card>

      {/* Section Notifications push sur cet appareil */}
      {notificationNotSupported ? null : (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Smartphone className="h-5 w-5 text-primary" />
              <CardTitle>{t('fcm.device_registration')}</CardTitle>
            </div>
            <CardDescription>{t('fcm.device_registration_desc')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div>
                  <div className="font-medium text-sm mb-1">
                    {notificationsEnabled 
                      ? t('fcm.status_enabled') 
                      : t('fcm.status_disabled')
                    }
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {notificationsEnabled 
                      ? t('fcm.status_enabled_desc') 
                      : t('fcm.status_disabled_desc')
                    }
                  </div>
                </div>
              </div>
              <Button
                size="sm"
                variant={notificationsEnabled ? "outline" : "default"}
                className="flex items-center whitespace-nowrap"
                onClick={async () => {
                  setIsRegistering(true);
                  const rep = await fcm.sendTokenToBackend()
                  setIsRegistering(false);
                  setNotificationsEnabled(rep?.success ? true : false);
                }}
                disabled={isRegistering}
              >
                {notificationsEnabled ? (
                  <>
                    <RefreshCw className={`h-4 w-4 mr-2 ${isRegistering ? 'animate-spin' : ''}`} />
                    {t('fcm.reload')}
                  </>
                ) : isRegistering ? (
                  <>
                    <div className="h-4 w-4 mr-2 animate-spin rounded-full border-b-2 border-primary"></div>
                    {t('fcm.enable_btn')}
                  </>
                ) : (
                  <>
                    <Bell className="h-4 w-4 mr-2" />
                    {t('fcm.enable_btn')}
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
