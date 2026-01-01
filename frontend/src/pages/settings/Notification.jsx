import React, { use, useContext, useState } from 'react';
import { UserContext, getGlobalReloadUser } from '../../contexts/UserContext';
import { useTranslation } from 'react-i18next';
import { updateUserInfo } from '../../services/auth/authService';
import { getToken } from '../../services/supabase/tokenUtils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Bell, RefreshCw, Mail, Smartphone } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL;

export default function Notification({ fcm }) {
  const { t } = useTranslation();
  const { userInfo } = useContext(UserContext);
  const uid = userInfo?.uid ?? null;
  const [notificationsEnabled, setNotificationsEnabled] = useState(window?.Notification?.permission === 'granted');
  const notificationNotSupported = !('Notification' in window) || window.Notification.permission === 'denied';
  const [isRegistering, setIsRegistering] = useState(false);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* En-tête */}
      <div className="space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">{t('notifications')}</h2>
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
          <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-background rounded-lg border">
                <Mail className="h-4 w-4 text-blue-600" />
              </div>
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
          <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-background rounded-lg border">
                <Smartphone className="h-4 w-4 text-green-600" />
              </div>
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
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 border rounded-lg bg-accent/20">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-background rounded-lg border">
                  <Bell className="h-4 w-4 text-primary" />
                </div>
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
                  await fcm.sendTokenToBackend()
                  setIsRegistering(false);
                  setNotificationsEnabled(window.Notification.permission === 'granted');
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
