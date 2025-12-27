import React, { use, useContext, useState } from 'react';
import { UserContext, getGlobalReloadUser } from '../../contexts/UserContext';
import { useTranslation } from 'react-i18next';
import { updateUserInfo } from '../../services/auth/authService';
import { getToken } from '../../services/supabase/tokenUtils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Bell, RefreshCw, Loader2 } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL;

export default function Notification({ fcm }) {
  const { t } = useTranslation();
  const { userInfo } = useContext(UserContext);
  const uid = userInfo?.uid ?? null;
  const [notificationsEnabled, setNotificationsEnabled] = useState(window?.Notification?.permission === 'granted');
  const notificationNotSupported = !('Notification' in window) || window.Notification.permission === 'denied';
  const [isRegistering, setIsRegistering] = useState(false);

  return (
    <div>
      <h2 className="mb-4 text-2xl font-bold">{t('notifications')}</h2>
      <p className="text-muted-foreground mb-4">{t('notification.instructions')}</p>

      <div className="flex items-center space-x-2 mb-3">
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
        <Label htmlFor="emailNotificationToggle" className="cursor-pointer">
          {t('notification.email_toggle')}
        </Label>
      </div>

      <div className="flex items-center space-x-2 mb-4">
        <Switch
          id="pushNotificationToggle"
          checked={userInfo?.pushEnabled}
          onCheckedChange={() => {
            updateUserInfo({
              push_enabled: !userInfo?.pushEnabled
            })
          }}
        />
        <Label htmlFor="pushNotificationToggle" className="cursor-pointer">
          {t('notification.push_toggle')}
        </Label>
      </div>
      {notificationNotSupported ? null : (
        <Card className="mb-3">
          <CardContent className="flex flex-col md:flex-row items-center justify-between py-3 px-4 gap-3">
            <div className="flex items-center mb-2 md:mb-0">
              <Bell className="h-5 w-5 text-primary mr-2" />
              <div>
                <div className="font-semibold text-base">{t('fcm.device_registration')}</div>
                <div className="text-muted-foreground text-sm">{t('fcm.device_registration_desc')}</div>
              </div>
            </div>
            <Button
              size="sm"
              variant={notificationsEnabled ? "outline" : "default"}
              className={`flex items-center rounded-full min-w-30 ${notificationsEnabled ? '' : 'font-bold'}`}
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
                  <RefreshCw className="h-4 w-4 mr-2" />
                  {t('fcm.reload')}
                </>
              ) : isRegistering ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t('fcm.enable_btn')}
                </>
              ) : (
                <>
                  <Bell className="h-4 w-4 mr-2" />
                  {t('fcm.enable_btn')}
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
